// This recognizes one exact body template, not a source's safety or total capability.
export function inspectLauncherBody({body,name,description}={}) {
  const unmatched={kind:'unmatched',scope:'body-only'};
  if([body,name,description].some(x=>typeof x!=='string'))return unmatched;
  if(!name.trim()||!description.trim()||/[\r\n]/.test(name+description))return unmatched;
  const normalized=body.replaceAll('\r\n','\n').trim();
  const match=/\nskillshub run ([A-Za-z0-9][A-Za-z0-9._-]*\/[A-Za-z0-9][A-Za-z0-9._-]*) --input "Your query here"\n/.exec(normalized);
  if(!match)return unmatched;
  const expected=`# ${name}\n\n${description}\n\n## Usage\n\nThis skill can be used standalone or as part of an Agent workflow on SkillsHub.\n\n### Standalone\n\n\`\`\`\nskillshub run ${match[1]} --input "Your query here"\n\`\`\`\n\n### In Agent\n\nAdd this skill to your Agent configuration to enable its capabilities.`;
  if(normalized!==expected)return unmatched;
  return {kind:'known-launcher-template',template:'skillshub-description-launcher-v1',launcherId:match[1],scope:'body-only',operationalMethodEstablished:false};
}
