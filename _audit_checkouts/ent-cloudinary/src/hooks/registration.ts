import { CloudConfig } from "./cloudConfig.js";
import { CloudinaryAuthHook } from "./cloudinaryAuthHook.js";
import { CustomHeadersHook } from "./customHeadersHook.js";
import { ResponseHeadersHook } from "./responseHeadersHook.js";
import { Hooks } from "./types.js";
import { UserAgentHook } from "./userAgentHook.js";
/*
 * This file is only ever generated once on the first generation and then is free to be modified.
 * Any hooks you wish to add should be registered in the initHooks function. Feel free to define them
 * in this file or in separate files in the hooks folder.
 */

export function initHooks(hooks: Hooks) {
  // Shared config — parsed once from CLOUDINARY_URL and env vars
  const config = new CloudConfig();

  hooks.registerBeforeRequestHook(new CloudinaryAuthHook(config));
  hooks.registerBeforeRequestHook(new CustomHeadersHook());
  hooks.registerSDKInitHook(new UserAgentHook());
  hooks.registerAfterSuccessHook(new ResponseHeadersHook(config.collectHeaders));
}
