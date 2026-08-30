# Mission skill stack

A mission skill stack is a compact, host-neutral receipt for the exact Godskill entrypoints selected for one bounded mission. It transports verified identities and digests, not skill bodies or third-party quarry text.

The compiler binds the mission and project fingerprint to the validated request envelope, route receipt, selected routing cards, and exact entrypoint digests. It carries the original effect and authority ceilings forward and rejects a selected card that asks for more. At most the router's three selected entrypoints can appear.

Hosts should compile a stack after routing and before loading entrypoint bodies. Recompile when the mission, project fingerprint, route, routing card, entrypoint digest, authority, effects, risk, or context envelope changes. `diffMissionSkillStacks` exposes the operational fields that changed without treating the receipt itself as authority.

The stack proves deterministic selection binding and zero source-body transport. It does not prove that a host loaded an entrypoint, followed it correctly, received permission for an effect, or completed the mission.
