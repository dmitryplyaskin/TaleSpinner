import { HttpError } from "@core/middleware/error-handler";

import { setActiveOperationProfile } from "../../../services/operations/operation-profile-settings-repository";
import { getOperationProfileById } from "../../../services/operations/operation-profiles-repository";

export async function setActiveOperationProfileWithValidation(
  activeProfileId: string | null
) {
  if (activeProfileId !== null) {
    const exists = await getOperationProfileById(activeProfileId);
    if (!exists) {
      throw new HttpError(404, "OperationProfile не найден", "NOT_FOUND");
    }
  }

  return setActiveOperationProfile({ activeProfileId });
}
