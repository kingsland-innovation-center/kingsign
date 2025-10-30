/* eslint-disable @typescript-eslint/no-unused-expressions */
// Initializes the `workspaces` service on path `/workspaces`
import { ServiceAddons } from "@feathersjs/feathers";
import { Application } from "../../declarations";
import { Workspaces } from "./workspaces.class";
import createModel from "../../models/workspaces.model";
import hooks from "./workspaces.hooks";
import { Request, Response } from "express";
import { authenticate } from "@feathersjs/express";
import { ObjectId } from "mongoose";

// Add this service to the service type index
declare module "../../declarations" {
  interface ServiceTypes {
    workspaces: Workspaces & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    Model: createModel(app),
    paginate: app.get("paginate"),
  };

  // Initialize our service with any options it requires
  app.use("/workspaces", new Workspaces(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service("workspaces");

  service.hooks(hooks);

  app.post(
    "/workspaces/user-workspaces",
    authenticate("jwt"),
    async (req: Request, res: Response) => {
      try {
        const params = req.params;
        const workspaceService = app.service("workspaces") as Workspaces;

        const userWorkspaces = await workspaceService.getUserWorkspaces(
          req.user?._id as ObjectId,
          params
        );

        res.send(userWorkspaces);
      } catch (error) {
        res.status(500).send({
          error: "Internal server error",
        });
      }
    }
  );

  app.post(
    "/workspaces/generate-api-key",
    authenticate("jwt"),
    async (req: Request, res: Response) => {
      const workspaceService = app.service("workspaces") as Workspaces;
      const workspace = await workspaceService.generateApiKey(req.body.workspaceId);
      res.send(workspace);
    }
  );
}
