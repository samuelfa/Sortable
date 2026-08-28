# Contribution Guidelines

### Issue

1.  Try [master](https://github.com/SortableJS/Sortable/tree/master/)-branch, perhaps the problem has been solved;
2.  [Use the search](https://github.com/SortableJS/Sortable/search?type=Issues&q=problem), maybe already have an answer;
3.  If not found, create example on [jsbin.com (draft)](https://jsbin.com/kamiwez/edit?html,js,output) and describe the problem.

---

### Pull Request

1.  Only request to merge with the [master](https://github.com/SortableJS/Sortable/tree/master/)-branch.
2.  Only modify source files, **do not commit the resulting build**

---

### Setup

1.  Fork the repo on [github](https://github.com)
2.  Clone locally
3.  Run `npm i` in the local repo
4.  Run `./setup.sh` for full environment (installs Playwright browsers, OS deps)

---

### Development

- Run `npm run build:umd:watch` for development builds
- Run `npm run test` to execute the test suite (Playwright)
- Run `npm run lint` to check code style
- Run `npm run format:check` to verify formatting
- Run `npm run format:write` to auto-format code
- Run `npx knip` to detect unused code/dependencies
- Run `npm run test:coverage` for code coverage (Chromium only)
- Run `npm audit` for security audit

---

### Building

- Run `npm run build` to build everything and minify
- Do not commit the resulting builds in any pull request – they will be generated at release

---

### CI & Node Version

This project uses **Node.js 24** (see `.nvmrc`) and GitHub Actions for CI.

See [docs/ci.md](docs/ci.md) for complete CI pipeline documentation.
