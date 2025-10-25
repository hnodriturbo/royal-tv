Awesome — here’s a clean, repeatable Team Git Routine you can follow every time (works great even when you’re solo). Copy it into your README if you want.

✅ Team Git Routine (master + feature branches)
## 0) Start of day (sync local with GitHub)
git checkout master
git pull origin master

## 1) Pick a TODO / Issue → create a branch

On GitHub: open the Issue → Development → Create a branch (recommended)
—or—
Locally:

git checkout master
git pull origin master
git checkout -b issue-<number>-short-description
git push -u origin issue-<number>-short-description

## 2) Work on the branch (commit small, reference the issue)
   

### edit files
git add .
git commit -m "Implement X; refs #<number>"
git push


Tip: push often; GitHub shows your commits under the Issue automatically.

## 3) Open a Pull Request (when the TODO is done)

Base: master

Compare: your branch

In PR description, add: Closes #<number> (auto-closes the issue on merge)

## 4) Merge the PR → clean up

After merging on GitHub:

git checkout master
git pull origin master

# delete merged branch locally + on GitHub
git branch -d issue-<number>-short-description
git push origin --delete issue-<number>-short-description

# prune local stale refs
git fetch --prune

5) Start the next TODO
git checkout master
git pull origin master
git checkout -b issue-<next-number>-new-task
git push -u origin issue-<next-number>-new-task