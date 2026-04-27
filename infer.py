#!/usr/bin/env python3
"""
infer.py — Algorithm 1: type inference from MCP tool schemas.

Inputs:  audit.csv (reads tool_name, verb_class, server_id, mutates_state,
                    semantically_irreversible, inverse_type — ground truth
                    columns are used ONLY for evaluation, not for prediction)
Outputs: audit_with_predictions.csv
         inference_report.md
"""

import csv
import re
import sys
from collections import defaultdict, Counter

# ── Verb taxonomy ────────────────────────────────────────────────────────────

VERB_PREFIXES = [
    # order matters: longest match first
    'create', 'delete', 'remove', 'update', 'set', 'patch', 'edit',
    'send', 'post', 'publish', 'notify', 'email', 'broadcast',
    'read', 'list', 'get', 'search', 'query', 'fetch', 'describe',
    'add', 'insert', 'register', 'provision', 'upload', 'push', 'build',
    'pull', 'install', 'uninstall', 'upgrade', 'deploy', 'deprovision',
    'run', 'start', 'stop', 'pause', 'resume', 'cancel', 'rebuild',
    'reset', 'revert', 'restore', 'merge', 'rebase', 'fork',
    'move', 'rename', 'transfer', 'copy',
    'execute', 'exec', 'apply', 'import', 'export',
    'open', 'close', 'connect', 'disconnect', 'reconnect',
    'grant', 'revoke', 'attach', 'detach',
    'transition', 'complete', 'finalize', 'void', 'confirm', 'capture',
    'retry', 'unblock',
]

ANTONYM = {
    'create': 'delete',
    'add':    'delete',
    'insert': 'delete',
    'register': 'delete',
    'provision': 'delete',
    'upload': 'delete',
    'push':   'delete',
    'build':  'delete',
    'pull':   'delete',
    'install': 'uninstall',
    'deploy': 'delete',
    'fork':   'delete',
    'delete': 'create',
    'remove': 'create',
    'uninstall': 'install',
    'update': 'update',
    'set':    'update',
    'patch':  'update',
    'edit':   'update',
    'rename': 'rename',
    'move':   'move',
    'start':  'stop',
    'stop':   'start',
    'pause':  'resume',
    'resume': 'pause',
    'grant':  'revoke',
    'revoke': 'grant',
    'attach': 'detach',
    'detach': 'attach',
    'connect': 'disconnect',
    'disconnect': 'connect',
    'reconnect': 'reconnect',
    'open':   'close',
    'close':  'open',
    'send':   None,  # semantically irreversible
    'post':   None,
    'publish': None,
    'notify': None,
    'email':  None,
    'broadcast': None,
}

# Verbs that cannot be inverted regardless of a candidate match
IRREVERSIBLE_VERBS = {'send', 'post', 'publish', 'notify', 'email', 'broadcast'}

# Keywords anywhere in the tool name that signal irreversibility
IRREVERSIBLE_KEYWORDS = {
    'send', 'post', 'publish', 'notify', 'email', 'broadcast',
    'charge', 'capture', 'pay', 'invoice', 'refund', 'settle',
    'webhook', 'trigger',
}

# Delete-family verbs (for exact/partial decision)
DELETE_VERBS = {'delete', 'remove', 'uninstall', 'deprovision', 'drop'}
# Create-family verbs
CREATE_VERBS = {'create', 'add', 'insert', 'register', 'provision',
                'upload', 'push', 'build', 'pull', 'install', 'deploy', 'fork'}
# Update-family verbs
UPDATE_VERBS = {'update', 'set', 'patch', 'edit', 'rename', 'move',
                'start', 'stop', 'pause', 'resume', 'grant', 'revoke',
                'attach', 'detach', 'connect', 'disconnect', 'reconnect',
                'open', 'close', 'transition', 'complete', 'finalize',
                'void', 'confirm', 'capture', 'retry', 'unblock', 'reset',
                'revert', 'restore', 'merge', 'rebase', 'apply', 'import'}


def extract_verb_and_resource(tool_name: str):
    """
    Returns (verb, resource) where resource is the normalized remainder
    after stripping the verb prefix (and any leading underscores/dashes).
    Handles both prefix style (create_container) and infix style
    (kubectl_create, s3_bucket_create, atlas-create-project).
    """
    name = tool_name.lower().replace('-', '_')
    tokens = name.split('_')

    # 1. Try prefix match on the first token
    if tokens and tokens[0] in VERB_PREFIXES:
        verb = tokens[0]
        resource = '_'.join(tokens[1:]).strip('_')
        return verb, resource

    # 2. Try prefix match on first two tokens joined (e.g. 'browser_navigate')
    # — already covered by the single-token check above

    # 3. Try infix / suffix match: scan all tokens for a known verb
    #    Return the verb and use the FULL name minus that token as resource
    for i, tok in enumerate(tokens):
        if tok in VERB_PREFIXES:
            rest = tokens[:i] + tokens[i+1:]
            resource = '_'.join(rest).strip('_')
            return tok, resource

    # 4. No verb found — return empty verb, full name as resource
    return '', name


def resource_overlap(res_a: str, res_b: str) -> bool:
    """
    True if resources share a meaningful overlap.
    Handles cases like resource_a='container' res_b='container',
    or 'bucket' in 's3_bucket', etc.
    """
    if not res_a or not res_b:
        # If either resource is empty (edge case like kubectl_create),
        # fall back to server-wide candidate set — treat as match
        return True
    # Substring match in either direction
    return res_a in res_b or res_b in res_a


def is_irrev_by_name(tool_name: str, verb: str) -> bool:
    name_tokens = set(tool_name.lower().replace('-', '_').split('_'))
    if verb in IRREVERSIBLE_VERBS:
        return True
    if name_tokens & IRREVERSIBLE_KEYWORDS:
        return True
    return False


def predict(tool_name: str, verb_class: str, server_tools: list[str]) -> str:
    """
    Returns predicted label: 'exact' | 'partial' | 'absent' | 'irrev'
    Uses only tool_name, verb_class, and the list of all tool names in
    the same server.
    """
    verb, resource = extract_verb_and_resource(tool_name)

    # --- Irreversibility check ---
    if is_irrev_by_name(tool_name, verb):
        return 'irrev'
    if verb_class == 'send':
        return 'irrev'

    # --- Find antonym verb ---
    antonym_verb = ANTONYM.get(verb)
    if antonym_verb is None:
        # verb not in ANTONYM map — check by verb_class
        if verb_class in ('create', 'update', 'delete'):
            antonym_verb = {'create': 'delete', 'delete': 'create',
                            'update': 'update'}[verb_class]
        else:
            # 'other': try resource-only matching across all tools
            antonym_verb = None

    # --- Search for candidates ---
    candidates = []
    for other in server_tools:
        if other == tool_name:
            continue
        other_verb, other_resource = extract_verb_and_resource(other)
        if antonym_verb is not None:
            if other_verb == antonym_verb and resource_overlap(resource, other_resource):
                candidates.append(other)
        else:
            # 'other' verb_class: match by resource name only (same resource, any verb)
            if other_verb != verb and resource_overlap(resource, other_resource) and resource:
                candidates.append(other)

    if not candidates:
        return 'absent'

    # --- Exact vs partial decision ---
    # Use the FORWARD tool's verb to decide
    effective_verb = verb if verb else verb_class
    if effective_verb in CREATE_VERBS or verb_class == 'create':
        return 'exact'
    if effective_verb in DELETE_VERBS or verb_class == 'delete':
        return 'partial'
    if effective_verb in UPDATE_VERBS or verb_class == 'update':
        return 'partial'
    # default conservative
    return 'partial'


# ── Ground-truth label normalisation ─────────────────────────────────────────

def gt_label(row: dict) -> str | None:
    """
    Return the ground-truth label for a mutating tool.
    irrev | exact | partial | absent
    Skip rows where ground truth is genuinely unknown.
    """
    if row['semantically_irreversible'] == 'yes':
        return 'irrev'
    it = row['inverse_type']
    if it in ('exact', 'partial', 'absent'):
        return it
    return None  # blank / unclassified — skip from F1


# ── Evaluation ───────────────────────────────────────────────────────────────

def precision_recall_f1(tp, fp, fn):
    p = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    r = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f = 2 * p * r / (p + r) if (p + r) > 0 else 0.0
    return p, r, f


def evaluate(predictions: list[tuple[str, str]]):
    """
    predictions: list of (ground_truth, predicted)
    Returns per-class stats and macro F1.
    """
    classes = ['exact', 'partial', 'absent', 'irrev']
    counts = {c: Counter() for c in classes}
    for gt, pred in predictions:
        for c in classes:
            if gt == c and pred == c:
                counts[c]['tp'] += 1
            elif gt != c and pred == c:
                counts[c]['fp'] += 1
            elif gt == c and pred != c:
                counts[c]['fn'] += 1

    results = {}
    for c in classes:
        p, r, f = precision_recall_f1(
            counts[c]['tp'], counts[c]['fp'], counts[c]['fn'])
        results[c] = dict(tp=counts[c]['tp'], fp=counts[c]['fp'],
                          fn=counts[c]['fn'], precision=p, recall=r, f1=f)
    macro_f1 = sum(results[c]['f1'] for c in classes) / len(classes)
    return results, macro_f1


def confusion_matrix(predictions, classes):
    cm = {gt: {pred: 0 for pred in classes} for gt in classes}
    for gt, pred in predictions:
        if gt in cm and pred in cm:
            cm[gt][pred] += 1
    return cm


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    rows = list(csv.DictReader(open('audit.csv')))

    # Build server tool lists (ALL tools, including read-only, for candidate search)
    server_tools = defaultdict(list)
    for r in rows:
        server_tools[r['server_id']].append(r['tool_name'])

    predictions_pairs = []   # (gt, pred) for evaluation
    disagreements    = []
    out_rows         = []

    for r in rows:
        row_out = dict(r)
        if r['mutates_state'] != 'yes':
            row_out['predicted_inverse_type'] = ''
            out_rows.append(row_out)
            continue

        pred = predict(r['tool_name'], r['verb_class'],
                       server_tools[r['server_id']])
        row_out['predicted_inverse_type'] = pred

        gt = gt_label(r)
        if gt is not None:
            predictions_pairs.append((gt, pred))
            if gt != pred:
                disagreements.append({
                    'server_id':   r['server_id'],
                    'tool_name':   r['tool_name'],
                    'verb_class':  r['verb_class'],
                    'ground_truth': gt,
                    'predicted':   pred,
                    'notes':       r.get('notes', ''),
                })

        out_rows.append(row_out)

    # Write predictions CSV
    fieldnames = list(rows[0].keys()) + ['predicted_inverse_type']
    with open('audit_with_predictions.csv', 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(out_rows)

    # Evaluate
    results, macro_f1 = evaluate(predictions_pairs)
    classes = ['exact', 'partial', 'absent', 'irrev']
    cm = confusion_matrix(predictions_pairs, classes)

    # ── Print to stdout ──────────────────────────────────────────────────────
    print(f"Evaluated on {len(predictions_pairs)} mutating tools with known ground truth\n")

    print("Per-class metrics:")
    print(f"{'Class':<10} {'TP':>4} {'FP':>4} {'FN':>4} {'Prec':>7} {'Rec':>7} {'F1':>7}")
    print("-" * 52)
    for c in classes:
        r2 = results[c]
        print(f"{c:<10} {r2['tp']:>4} {r2['fp']:>4} {r2['fn']:>4} "
              f"{r2['precision']:>7.3f} {r2['recall']:>7.3f} {r2['f1']:>7.3f}")
    print(f"\nMacro-averaged F1: {macro_f1:.3f}")

    print("\nConfusion matrix (rows=ground truth, cols=predicted):")
    header = f"{'GT \\ Pred':<12}" + "".join(f"{c:>10}" for c in classes)
    print(header)
    for gt in classes:
        row_str = f"{gt:<12}" + "".join(f"{cm[gt][p]:>10}" for p in classes)
        print(row_str)

    print(f"\nDisagreements ({len(disagreements)} total; first 30 shown):")
    print(f"{'server_id':<22} {'tool_name':<35} {'GT':<10} {'Pred':<10}")
    print("-" * 80)
    for d in disagreements[:30]:
        print(f"{d['server_id']:<22} {d['tool_name']:<35} "
              f"{d['ground_truth']:<10} {d['predicted']:<10}")

    # ── Write report ─────────────────────────────────────────────────────────
    lines = []
    w2 = lines.append
    w2("# Type Inference Evaluation Report\n")
    w2(f"Evaluated on **{len(predictions_pairs)}** mutating tools with known ground truth.\n")
    w2(f"Algorithm uses only `tool_name`, `verb_class`, and the server's tool inventory.\n")

    w2("## Per-Class Metrics\n")
    w2("| Class | TP | FP | FN | Precision | Recall | F1 |")
    w2("|---|---|---|---|---|---|---|")
    for c in classes:
        r2 = results[c]
        w2(f"| {c} | {r2['tp']} | {r2['fp']} | {r2['fn']} | "
           f"{r2['precision']:.3f} | {r2['recall']:.3f} | {r2['f1']:.3f} |")
    w2(f"\n**Macro-averaged F1: {macro_f1:.3f}**\n")

    w2("## Confusion Matrix\n")
    w2("Rows = ground truth, columns = predicted.\n")
    header_md = "| GT \\ Pred |" + "|".join(f" {c} " for c in classes) + "|"
    sep_md    = "|---|" + "|".join("---" for _ in classes) + "|"
    w2(header_md)
    w2(sep_md)
    for gt in classes:
        row_md = f"| **{gt}** |" + "|".join(f" {cm[gt][p]} " for p in classes) + "|"
        w2(row_md)
    w2("")

    w2("## Disagreements (first 30)\n")
    w2("| server_id | tool_name | verb_class | ground_truth | predicted |")
    w2("|---|---|---|---|---|")
    for d in disagreements[:30]:
        w2(f"| {d['server_id']} | {d['tool_name']} | {d['verb_class']} | "
           f"{d['ground_truth']} | {d['predicted']} |")
    w2(f"\nTotal disagreements: {len(disagreements)} / {len(predictions_pairs)}\n")

    w2("## Notes on Algorithm\n")
    w2("- Resource extraction strips the leading verb token; for infix-verb names "
       "(e.g. `kubectl_create`, `s3_bucket_create`) the verb is found by scanning all tokens.\n")
    w2("- Candidate inverse search uses substring overlap on the resource noun, "
       "which handles both `create_container`/`remove_container` and "
       "`s3_bucket_create`/`s3_bucket_delete`.\n")
    w2("- Exact/partial decision follows the rubric: create→delete pairs are `exact`; "
       "all update and delete→create pairs are `partial`.\n")
    w2("- Irreversibility is triggered by verb (`send`, `post`, …) or keyword in name "
       "(`charge`, `capture`, `pay`, …).\n")

    with open('inference_report.md', 'w') as f:
        f.write("\n".join(lines))

    print("\n→ audit_with_predictions.csv written")
    print("→ inference_report.md written")
    return macro_f1


if __name__ == '__main__':
    macro = main()
    print(f"\nHeadline: Macro-averaged F1 = {macro:.3f}")
