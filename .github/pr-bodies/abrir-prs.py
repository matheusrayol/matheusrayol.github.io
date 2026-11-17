"""Abre as PRs descritas em .github/pr-bodies/pr-N.{branch,title,md}.

Idempotente: se ja existir PR com o mesmo head, nao abre outra.
Usa so a API do GitHub e a GITHUB_TOKEN do proprio workflow.
Escreve pr-result.md com o resultado de cada PR.
"""
import glob
import json
import os
import re
import urllib.error
import urllib.request

TOKEN = os.environ["GITHUB_TOKEN"]
REPO = os.environ["GH_REPO"]
OWNER = REPO.split("/")[0]
API = "https://api.github.com/repos/" + REPO
BASE = "main"


def api(method, path, payload=None):
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(API + path, data=data, method=method)
    req.add_header("Authorization", "Bearer " + TOKEN)
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("X-GitHub-Api-Version", "2022-11-28")
    if data is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read().decode("utf-8")
            return resp.status, (json.loads(raw) if raw else {})
    except urllib.error.HTTPError as err:
        return err.code, err.read().decode("utf-8", "replace")


def branch_exists(name):
    status, _ = api("GET", "/git/ref/heads/" + name)
    return status == 200


def existing_pr(head):
    status, data = api("GET", "/pulls?state=all&head=" + OWNER + ":" + head + "&per_page=5")
    if status == 200 and isinstance(data, list) and data:
        return data[0].get("number")
    return None


lines = ["# Resultado da abertura das PRs", ""]
for body_path in sorted(glob.glob(".github/pr-bodies/pr-*.md")):
    num = re.search(r"pr-(\d+)\.md$", body_path).group(1)
    folder = os.path.dirname(body_path)
    head = open(folder + "/pr-" + num + ".branch", encoding="utf-8").read().strip()
    title = open(folder + "/pr-" + num + ".title", encoding="utf-8").read().strip()
    body = open(body_path, encoding="utf-8").read()
    if not branch_exists(head):
        reserve = folder + "/fallback/pr-" + num
        if not os.path.exists(reserve + ".branch"):
            lines.append("- PR " + num + ": FALHOU - branch `" + head + "` nao existe no origin.")
            continue
        reserve_head = open(reserve + ".branch", encoding="utf-8").read().strip()
        if not branch_exists(reserve_head):
            lines.append("- PR " + num + ": FALHOU - nem `" + head + "` nem `" + reserve_head + "` existe no origin.")
            continue
        head = reserve_head
        title = open(reserve + ".title", encoding="utf-8").read().strip()
        body = open(reserve + ".md", encoding="utf-8").read()
        lines.append("- PR " + num + ": a branch rebaseada nao esta no origin; usada a branch de reserva `" + reserve_head + "` (corpo da versao A).")
    already = existing_pr(head)
    if already:
        lines.append("- PR " + num + ": ja existia (PR #" + str(already) + ", branch `" + head + "`).")
        continue
    status, data = api("POST", "/pulls", {"title": title, "head": head, "base": BASE, "body": body})
    if status == 201:
        lines.append("- PR " + num + ": CRIADA - PR #" + str(data.get("number")) + " - " + str(data.get("html_url")) + " (branch `" + head + "`).")
    else:
        lines.append("- PR " + num + ": FALHOU (" + str(status) + ") - " + str(data)[:400])

open("pr-result.md", "w", encoding="utf-8").write("\n".join(lines) + "\n")
print("\n".join(lines))
