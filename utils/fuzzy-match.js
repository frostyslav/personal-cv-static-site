/**
 * Fuzzy matching with alias support — shared between browser and tests.
 */
const ALIASES = {
  k8s: 'kubernetes',
  aws: 'amazon web services',
  gcp: 'google cloud platform',
  tf: 'terraform',
  tg: 'terragrunt',
  gh: 'github',
  gl: 'gitlab',
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  pg: 'postgresql',
  mongo: 'mongodb',
  iac: 'infrastructure as code',
  otel: 'opentelemetry',
  eks: 'amazon eks',
  aks: 'azure aks',
  gke: 'google gke',
  ecs: 'amazon ecs',
  rds: 'amazon rds',
  cdk: 'aws cdk',
  cfn: 'aws cloudformation',
  ovs: 'openvswitch',
  ovn: 'open virtual network',
  dpdk: 'data plane development kit',
  cni: 'container network interface',
  rag: 'retrieval-augmented generation',
  vm: 'virtualization',
  kvm: 'kvm',
  hv: 'hyper-v',
};

function fuzzyMatch(query, text) {
  const q = query.toLowerCase();
  const t = text.toLowerCase();

  // Exact substring match
  if (t.includes(q)) return true;

  // Alias match — check if query is a known alias
  const aliasTarget = ALIASES[q];
  if (aliasTarget && t.includes(aliasTarget)) return true;

  // Reverse alias — check if any alias value matches and query matches the key
  for (const [abbr, full] of Object.entries(ALIASES)) {
    if (q.includes(full) && t.includes(abbr)) return true;
  }

  // Fuzzy character sequence match
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

// Support both ESM (esbuild bundle) and CJS (Node tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ALIASES, fuzzyMatch };
}
export { ALIASES, fuzzyMatch };
