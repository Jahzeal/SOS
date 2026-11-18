/**
 * Plan features as shown to customers. The admin checklist has a placeholder item,
 * "Device Capacity Limit"; here it becomes the plan's real limit, e.g. "Up to 500 devices".
 */
export function planFeatureLabel(feature: string, plan: { maxDevices?: number | null }): string {
  if (feature.trim().toLowerCase() === 'device capacity limit') {
    const max = Number(plan?.maxDevices);
    return max > 0 ? `Up to ${max.toLocaleString('en-NG')} devices` : 'Unlimited devices';
  }
  return feature;
}
