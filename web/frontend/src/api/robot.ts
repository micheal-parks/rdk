import type { Client } from '@viamrobotics/sdk';
import { robotApi, type ResourceName } from '@viamrobotics/sdk';

export const getOperations = (client: Client) => {
  const request = new robotApi.GetOperationsRequest();

  return new Promise<robotApi.Operation.AsObject[]>((resolve, reject) => {
    client.robotService.getOperations(request, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      if (!response) {
        reject(new Error('An unexpected issue occurred.'));
        return;
      }

      resolve(response.toObject().operationsList ?? []);
    });
  });
};

export const getResourceNames = (client: Client) => {
  const request = new robotApi.ResourceNamesRequest();

  return new Promise<ResourceName[]>((resolve, reject) => {
    client.robotService.resourceNames(request, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      if (!response) {
        reject(new Error('An unexpected issue occured.'));
        return;
      }

      resolve(response.toObject().resourcesList);
    });
  });
};

export const getSessions = (client: Client) => {
  const request = new robotApi.GetSessionsRequest();

  return new Promise<robotApi.Session.AsObject[]>((resolve, reject) => {
    client.robotService.getSessions(request, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      if (!response) {
        reject(new Error('An unexpected issue occurred.'));
        return;
      }

      resolve(response.toObject().sessionsList);
    });
  });
};
