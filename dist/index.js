/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 873:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 409:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ }),

/***/ 778:
/***/ ((module) => {

module.exports = eval("require")("asana");


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
const core = __nccwpck_require__(873);
const github = __nccwpck_require__(409);
const asana = __nccwpck_require__(778);

async function writeComment(asanaClient, taskId, comment) {
  try {
    await asanaClient.tasks.findById(taskId);
  } catch (error) {
    core.setFailed("Asana task not found: " + error.message);
    return;
  }

  try {
    await asanaClient.tasks.addComment(taskId, {
      text: comment,
    });
    core.info(`Added the commit link the Asana task ${taskId}.`);
  } catch (error) {
    core.setFailed("Unable to add comment to task");
    return;
  }
}

function extractTaskID(commitMessage) {
  const regex = new RegExp(
    "TASK.+(https:\\/\\/app\\.asana\\.com\\/(\\d+)\\/(?<project>\\d+)\\/(?<task>\\d+).*?)",
    "gm"
  );

  let m;

  while ((m = regex.exec(commitMessage)) !== null) {
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }
    if (m.groups.task) {
      return m.groups.task;
    }
  }
  return null;
}

function extractComment(commitMessage) {
  let commentTask = commitMessage.split('TASK');
  return commentTask[0].trim();
}

async function processCommit(asanaClient, commit) {
  core.info("Processing commit " + commit.url);
  const taskId = extractTaskID(commit.message);
  const comment = extractComment(commit.message);
  if (taskId) {
    writeComment(asanaClient, taskId, comment + "\n\n" + "Ref: " + commit.url);
  } else {
    core.notice(`No Asana task URL provided in commit message.`);
  }
}

async function main() {
  if (!process.env.TEST && github.context.eventName !== "push") {
    core.setFailed(
      "Action must be triggered with push event. It is " +
        github.context.eventName
    );
    return;
  }
  const pushPayload = github.context.payload;

  let payloadCommits = pushPayload.commits;
  const commits =
    process.env.COMMITS != null
      ? JSON.parse(process.env.COMMITS)
      : payloadCommits;
  if (!Array.isArray(commits) || !commits.length) {
    core.setFailed("Unable to read commits from event");
    return;
  }

  const asanaPAT = process.env.ASANAPAT || core.getInput("asana-pat");
  if (!asanaPAT) {
    core.setFailed("Asana access token not found!");
    return;
  }

  const asanaClient = asana.Client.create({
    defaultHeaders: { "asana-enable": "new-sections,string_ids" },
    logAsanaChangeWarnings: false,
  }).useAccessToken(asanaPAT);
  if (!asanaClient) {
    core.setFailed("Unable to establish an Asana API client");
    return;
  }

  for (const commit of commits) {
    processCommit(asanaClient, commit);
  }
}

try {
  main();
} catch (error) {
  core.setFailed(error.message);
}

})();

module.exports = __webpack_exports__;
/******/ })()
;