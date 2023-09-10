const core = require('@actions/core');
const github = require('@actions/github');
const yaml = require('js-yaml');
const _ = require('lodash');

const ActionValidator = require('./validators/ActionValidator');

class App {
  /**
   * @param {Object} config
   */
  constructor(config) {
    this.config = config;
    this.client = github.getOctokit(config['github-token']);
    this.owner = github.context.repo.owner;
    this.repo = github.context.repo.repo;
  }

  async performActions() {
    const payload = github.context.payload;
    const threadType = payload.issue ? 'issue' : 'pr';
    const processOnly = this.config['process-only'];
    if (processOnly && processOnly !== threadType) {
      return;
    }

    const actions = await this.#getLabelActions(
      payload.label.name,
      payload.action,
      threadType
    );
    if (!actions) {
      core.debug('No actions found');
      return;
    }

    const threadData = payload.issue || payload.pull_request;
    const issue = {
      owner: this.owner,
      repo: this.repo,
      issue_number: threadData.number
    };

    if (actions.comment) {
      core.debug('Commenting');
      const lock = {
        active: threadData.locked,
        reason: threadData.active_lock_reason
      };
      await this.#ensureUnlock(issue, lock, async () => {
        for (let commentBody of actions.comment) {
          commentBody = commentBody.replace(
            /{issue-author}/,
            threadData.user.login
          );

          await this.client.rest.issues.createComment({
            ...issue,
            body: commentBody
          });
        }
      });
    }

    if (actions.label) {
      const currentLabels = threadData.labels.map(label => label.name);
      const newLabels = _.difference(actions.label, currentLabels);

      if (newLabels.length) {
        core.debug('Labeling');
        await this.client.rest.issues.addLabels({
          ...issue,
          labels: newLabels
        });
      }
    }

    if (actions.reviewers.length > 0) {
      core.debug('Assigning reviewers');
      const author = threadData.user.login;
      let reviewers = _.without(actions.reviewers, author);
      reviewers = _.sampleSize(reviewers, actions['number-of-reviewers']);
      await this.#addReviewers(reviewers);
    }

    if (actions.unlabel) {
      const currentLabels = threadData.labels.map(label => label.name);
      const removedLabels = _.intersection(currentLabels, actions.unlabel);

      for (const label of removedLabels) {
        core.debug('Unlabeling');
        await this.client.rest.issues.removeLabel({
          ...issue,
          name: label
        });
      }
    }

    if (actions.reopen && threadData.state === 'closed' && !threadData.merged) {
      core.debug('Reopening');
      await this.client.rest.issues.update({ ...issue, state: 'open' });
    }

    if (actions.close && threadData.state === 'open') {
      core.debug('Closing');
      await this.client.rest.issues.update({ ...issue, state: 'closed' });
    }

    if (actions.lock && !threadData.locked) {
      core.debug('Locking');
      const params = { ...issue };
      const lockReason = actions['lock-reason'];
      if (lockReason) {
        Object.assign(params, {
          lock_reason: lockReason,
          headers: {
            Accept: 'application/vnd.github.sailor-v-preview+json'
          }
        });
      }
      await this.client.rest.issues.lock(params);
    }

    if (actions.unlock && threadData.locked) {
      core.debug('Unlocking');
      await this.client.rest.issues.unlock(issue);
    }
  }

  async #getLabelActions(label, event, threadType) {
    if (event === 'unlabeled') {
      label = `-${label}`;
    }
    threadType = threadType === 'issue' ? 'issues' : 'prs';

    const actionConfig = await this.#getActionConfig();
    const action = actionConfig[label];
    if (action) {
      const threadActions = action[threadType];
      if (threadActions) {
        Object.assign(action, threadActions);
      }
      return action;
    }
  }

  /**
   * @returns {Promise<Object>}
   */
  async #getActionConfig() {
    const configData = await this.#getContent();
    const input = yaml.load(Buffer.from(configData, 'base64').toString());
    if (!input) {
      throw new Error(`Empty configuration file (${this.#configPath})`);
    }
    return await ActionValidator.validate(input);
  }

  async #getContent() {
    try {
      const response = await this.client.rest.repos.getContent({
        ...github.context.repo,
        path: this.#configPath
      });
      return response.data.content;
    } catch (err) {
      throw err.status === 404
        ? new Error(`Missing configuration file (${this.#configPath})`)
        : err;
    }
  }

  async #ensureUnlock(issue, lock, action) {
    if (lock.active) {
      if (!lock.hasOwnProperty('reason')) {
        const { data: issueData } = await this.client.rest.issues.get({
          ...issue,
          headers: {
            Accept: 'application/vnd.github.sailor-v-preview+json'
          }
        });
        lock.reason = issueData.active_lock_reason;
      }
      await this.client.rest.issues.unlock(issue);

      let actionError;
      try {
        await action();
      } catch (err) {
        actionError = err;
      }

      if (lock.reason) {
        issue = {
          ...issue,
          lock_reason: lock.reason,
          headers: {
            Accept: 'application/vnd.github.sailor-v-preview+json'
          }
        };
      }
      await this.client.rest.issues.lock(issue);

      if (actionError) {
        throw actionError;
      }
    } else {
      await action();
    }
  }

  async #addReviewers(reviewers) {
    await this.client.rest.pulls.requestReviewers({
      owner: this.owner,
      repo: this.repo,
      pull_number: github.context.issue.number,
      reviewers
    });
  }

  get #configPath() {
    return this.config['config-path'];
  }
}

module.exports = App;
