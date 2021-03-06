/*!
 * Copyright 2019 Palantir Technologies, Inc.
 *
 * Licensed under the MIT license. See LICENSE file in the project root for details.
 *
 */

import { Context, RuleModule } from "@monorepolint/core";
import { mutateJson, PackageJson } from "@monorepolint/utils";
import diff from "jest-diff";
import * as r from "runtypes";

export const Options = r.Record({
  scripts: r.Dictionary(r.String), // string => string
});

export type Options = r.Static<typeof Options>;

export const MSG_NO_SCRIPTS_BLOCK = "No scripts block in package.json";

export const packageScript = {
  check: function expectPackageScript(context: Context, options: Options) {
    const packageJson = context.getPackageJson();
    if (packageJson.scripts === undefined) {
      context.addError({
        file: context.getPackageJsonPath(),
        message: MSG_NO_SCRIPTS_BLOCK,
        fixer: () => {
          mutateJson<PackageJson>(context.getPackageJsonPath(), input => {
            input.scripts = {};
            return input;
          });
        },
      });
      return;
    }
    for (const [name, value] of Object.entries(options.scripts)) {
      if (packageJson.scripts[name] !== value) {
        context.addError({
          file: context.getPackageJsonPath(),
          message: `Expected standardized script entry for '${name}'`,
          longMessage: diff(value + "\n", (packageJson.scripts[name] || "") + "\n"),
          fixer: () => {
            mutateJson<PackageJson>(context.getPackageJsonPath(), input => {
              input.scripts![name] = value;
              return input;
            });
          },
        });
      }
    }
  },
  optionsRuntype: Options,
} as RuleModule<typeof Options>;
