// A place's files follow its rename (R79). Pictures of a place are rows of
// the account's assets table filed under "place:" and the place's key, so a
// rename that changes the key moves the rows to the new one. The app's
// account store and the door's rename_place both call this, with their own
// client; nothing here runs signed out, and nothing here is a DOM.
//
// Renaming into a place that already has pictures adds to them: the rows
// already under the new key are not touched, so both sets stand.

import { placeFilesMove } from "./places.js";

/**
 * Move every file of the project filed under the old place to the new one.
 * Returns how many moved, and the account's words when it refused.
 */
export async function movePlaceFiles(client, projectId, from, to) {
  const move = placeFilesMove(from, to);
  if (!client || !projectId || !move) return { moved: 0, error: null };
  try {
    const { data, error } = await client.from("assets").update({ subject: move.to }).eq("project_id", projectId).eq("subject", move.from).select("id");
    if (error) return { moved: 0, error: error.message };
    return { moved: (data ?? []).length, error: null };
  } catch (error) {
    return { moved: 0, error: error instanceof Error ? error.message : String(error) };
  }
}
