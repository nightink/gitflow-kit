'use strict';

const debug = require('debug')('gitflowkit');
const runScript = require('runscript');

class GitFlowKit {
  transformRefs(refs) {
    const rawObj = {};
    if (!Array.isArray(refs)) return rawObj;

    return refs.reduce((obj, ref) => {
      if (!ref) return obj;

      const arr = ref.split(' ');
      obj[arr[0]] = arr[1].replace('refs/heads/', '');

      return obj;
    }, rawObj);
  }

  async analysis() {
    const commands = [
      // 获取当前项目 git 所有分支列表
      'git show-ref --heads',
      // 获取特性分支所有 git log commit sha1
      'git log --pretty=format:%H',
      // 获取当前特性分支
      'git symbolic-ref --short HEAD',
      // 获取特性分支最后 commit 信息
      'git show -s --format=%s',
    ];

    // 获取本地 repo 所以 checkout 出来分支 sha1 hash 和 branch 数据
    const gitShell = commands.map(async sh => {
      const stdio = await runScript(sh, { stdio: 'pipe' });
      return stdio.stdout.toString().split('\n');
    });

    const [ branchHashList, sourceLogHashList, sourceList, messageList ] = await Promise.all(gitShell);

    // 个人特性分支
    this.sourceBranch = sourceList[0];

    const branchObj = this.transformRefs(branchHashList);

    // 查找个人特性分支迭代获取最近的父源分支阶段 sha1 值
    const targetCommit = sourceLogHashList.find(sha1Hash => {
      return branchObj[sha1Hash] && branchObj[sha1Hash] !== this.sourceBranch;
    });
    // 原始分支
    this.targetBranch = branchObj[targetCommit];

    console.debug(
      'targetBranch: %s, targetCommit: %s, branchObj: %j',
      this.targetBranch,
      targetCommit,
      branchObj,
    );

    return {
      sourceBranch: this.sourceBranch,
      tragetBranch: this.targetBranch,
      commitTitle: messageList[0],
      branchObj,
    };
  }
}


const gitFlowKit = new GitFlowKit();
module.exports = gitFlowKit;
module.exports.GitFlowKit = GitFlowKit;
