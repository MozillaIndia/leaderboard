function createGitHubClient() {
  return {
    getContributorList: function(repo, callback) {
      $.get("https://api.github.com/repos/" + repo + "/contributors", callback);
    },

    getCommitList: function(repo, author, callback) {
      $.get("https://api.github.com/repos/" + repo + "/commits?author=" + author,
            callback)
    }
  };
}

