import { onRequest as __api___path___ts_onRequest } from "C:\\Users\\BaywatchRobotics\\Desktop\\FRC7790.com\\functions\\api\\[[path]].ts"

export const routes = [
    {
      routePath: "/api/:path*",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api___path___ts_onRequest],
    },
  ]