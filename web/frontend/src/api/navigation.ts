import * as THREE from 'three';
import { type Client, commonApi, navigationApi } from '@viamrobotics/sdk';
import { OrientationVector } from 'three-orientation-vector';
import { rcLogConditionally } from '@/lib/log';
import type {
  BoxGeometry, CapsuleGeometry, NavigationModes, Obstacle, SphereGeometry, Waypoint,
} from './types/navigation';
import { notify } from '@viamrobotics/prime';

export * from './types/navigation';

const ov = new OrientationVector();
const quat = new THREE.Quaternion();

export const setMode = async (robotClient: Client, name: string, mode: NavigationModes) => {
  const request = new navigationApi.SetModeRequest();
  request.setName(name);
  request.setMode(mode);

  rcLogConditionally(request);

  const response = await new Promise<navigationApi.SetModeResponse | null>((resolve, reject) => {
    robotClient.navigationService.setMode(request, (error, res) => {
      if (error) {
        reject(error);
      } else {
        resolve(res);
      }
    });
  });

  return response?.toObject();
};

export const setWaypoint = async (robotClient: Client, lat: number, lng: number, name: string) => {
  const request = new navigationApi.AddWaypointRequest();
  const point = new commonApi.GeoPoint();

  point.setLatitude(lat);
  point.setLongitude(lng);
  request.setName(name);
  request.setLocation(point);

  rcLogConditionally(request);

  const response = await new Promise<navigationApi.AddWaypointResponse | null>((resolve, reject) => {
    robotClient.navigationService.addWaypoint(request, (error, res) => {
      if (error) {
        reject(error);
      } else {
        resolve(res);
      }
    });
  });

  return response?.toObject();
};

const formatWaypoints = (list: navigationApi.Waypoint[]) => {
  return list.map((item) => {
    const location = item.getLocation();
    return {
      id: item.getId(),
      lng: location?.getLongitude() ?? 0,
      lat: location?.getLatitude() ?? 0,
    };
  });
};

export const getObstacles = async (robotClient: Client, name: string): Promise<Obstacle[]> => {
  const req = new navigationApi.GetObstaclesRequest();
  req.setName(name);

  rcLogConditionally(req);

  const response = await new Promise<navigationApi.GetObstaclesResponse | null>((resolve, reject) => {
    robotClient.navigationService.getObstacles(req, (error, res) => {
      if (error) {
        reject(error);
      } else {
        resolve(res);
      }
    });
  });

  const list = response?.getObstaclesList() ?? [];

  return list.map((obstacle, index) => {
    const location = obstacle.getLocation();

    return {
      name: `Obstacle ${index + 1}`,
      location: {
        lng: location?.getLongitude() ?? 0,
        lat: location?.getLatitude() ?? 0,
      },
      geometries: obstacle.getGeometriesList().map((geometry) => {
        const center = geometry.getCenter();
        ov.set(center?.getOX(), center?.getOY(), center?.getOZ(), center?.getTheta());
        ov.toQuaternion(quat);
        const quaternion = { x: quat.x, y: quat.y, z: quat.z, w: quat.w };

        if (geometry.hasBox()) {
          const dimsMm = geometry.getBox()?.getDimsMm();

          return {
            type: 'box',
            length: (dimsMm?.getX() ?? 0) / 1000,
            width: (dimsMm?.getY() ?? 0) / 1000,
            height: (dimsMm?.getZ() ?? 0) / 1000,
            quaternion,
          } satisfies BoxGeometry;

        } else if (geometry.hasSphere()) {

          return {
            type: 'sphere',
            radius: (geometry.getSphere()?.getRadiusMm() ?? 0) / 1000,
            quaternion,
          } satisfies SphereGeometry;

        } else if (geometry.hasCapsule()) {
          const capsule = geometry.getCapsule();

          return {
            type: 'capsule',
            radius: (capsule?.getRadiusMm() ?? 0) / 1000,
            length: (capsule?.getLengthMm() ?? 0) / 1000,
            quaternion,
          } satisfies CapsuleGeometry;

        }

        notify.danger('An unsupported geometry was encountered in an obstacle', JSON.stringify(geometry.toObject()));
        throw new Error(
          `An unsupported geometry was encountered in an obstacle: ${JSON.stringify(geometry.toObject())}`
        );
      }),
    } satisfies Obstacle;
  });
};

export const getWaypoints = async (robotClient: Client, name: string): Promise<Waypoint[]> => {
  const req = new navigationApi.GetWaypointsRequest();
  req.setName(name);

  rcLogConditionally(req);

  const response = await new Promise<{ getWaypointsList(): navigationApi.Waypoint[] } | null>((resolve, reject) => {
    robotClient.navigationService.getWaypoints(req, (error, res) => {
      if (error) {
        reject(error);
      } else {
        resolve(res);
      }
    });
  });

  return formatWaypoints(response?.getWaypointsList() ?? []);
};

export const removeWaypoint = async (robotClient: Client, name: string, id: string) => {
  const request = new navigationApi.RemoveWaypointRequest();
  request.setName(name);
  request.setId(id);

  rcLogConditionally(request);

  const response = await new Promise<navigationApi.RemoveWaypointResponse | null>((resolve, reject) => {
    robotClient.navigationService.removeWaypoint(request, (error, res) => {
      if (error) {
        reject(error);
      } else {
        resolve(res);
      }
    });
  });

  return response?.toObject();
};

export const getLocation = async (robotClient: Client, name: string) => {
  const request = new navigationApi.GetLocationRequest();
  request.setName(name);

  rcLogConditionally(request);

  const response = await new Promise<navigationApi.GetLocationResponse | null>((resolve, reject) => {
    robotClient.navigationService.getLocation(request, (error, res) => {
      if (error) {
        reject(error);
      } else {
        resolve(res);
      }
    });
  });

  const location = response?.getLocation();

  return {
    lat: location?.getLatitude() ?? 0,
    lng: location?.getLongitude() ?? 0,
  };
};
