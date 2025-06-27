import { onRequestPut as __api_profile_update_username_ts_onRequestPut } from "C:\\Users\\gavin\\OneDrive\\Documents\\Github\\FRC7790.com\\functions\\api\\profile\\update-username.ts"
import { onRequest as __api___path___ts_onRequest } from "C:\\Users\\gavin\\OneDrive\\Documents\\Github\\FRC7790.com\\functions\\api\\[[path]].ts"

export const routes = [
    {
      routePath: "/api/profile/update-username",
      mountPath: "/api/profile",
      method: "PUT",
      middlewares: [],
      modules: [__api_profile_update_username_ts_onRequestPut],
    },
  {
      routePath: "/api/:path*",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api___path___ts_onRequest],
    },
  ]