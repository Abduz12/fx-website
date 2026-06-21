import app from "../../api/boot";

export default async (req: Request, context: any) => {
  return app.fetch(req, context);
};

export const config = {
  path: "/api/*"
};
