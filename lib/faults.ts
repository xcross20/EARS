export function shouldShowDemoFault(demoState: string | undefined, allowFaults: string | undefined): boolean {
  return allowFaults === "1" && demoState === "error";
}

export function shouldDelayDemoLoad(demoState: string | undefined, allowFaults: string | undefined): boolean {
  return allowFaults === "1" && demoState === "slow";
}

export const DEMO_LOAD_DELAY_MS = 1200;
