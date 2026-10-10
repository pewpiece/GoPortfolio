import fs from 'node:fs';
import type { AstroIntegration } from 'astro';
import { buildReport, formatReport } from './report';

/** Prints the draft/missing-items report at dev start and build start, and saves build-report.txt. */
export function reportIntegration(): AstroIntegration {
  return {
    name: 'portfolio-report',
    hooks: {
      'astro:config:setup': ({ logger }) => {
        const text = formatReport();
        fs.writeFileSync('build-report.txt', text);
        console.log('\n' + text);
        const { problems } = buildReport();
        if (problems.length > 0 && process.env.NODE_ENV === 'production') {
          logger.error('Invalid content; see the report above.');
          process.exitCode = 1;
        }
      },
    },
  };
}
