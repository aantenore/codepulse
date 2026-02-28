declare module 'inquirer' {
  export function prompt(questions: unknown[]): Promise<{ source: string; traces: string; output: string; ai?: string }>;
}
