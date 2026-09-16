#!/usr/bin/env python3
"""Check Mathrix project data against the public GitHub repository list."""
import json
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = (ROOT / 'data/projects.js').read_text(encoding='utf-8')
ENTRY = re.compile(r"\{name:'([^']+)',date:'([^']+)',category:'([^']+)',description:'([^']+)'\}")
entries = [dict(zip(('name', 'date', 'category', 'description'), match)) for match in ENTRY.findall(SOURCE)]
names = [entry['name'] for entry in entries]
categories = {'嵌入式与控制', '系统与设备', 'Web 与桌面', '机器人与数据', '工程工具'}
errors = []
if len(names) != len(set(names)):
    errors.append('Duplicate project name')
for entry in entries:
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', entry['date']):
        errors.append(f"Invalid date: {entry['name']}")
    if entry['category'] not in categories:
        errors.append(f"Unknown category: {entry['name']}")
    if not entry['description'].strip():
        errors.append(f"Empty description: {entry['name']}")
if names and 'Dreams-Possible.github.io' in names:
    errors.append('Site repository should not be listed as a project')
if not entries:
    errors.append('No project entries parsed; check data/projects.js format')

print(f'Local projects: {len(entries)}')
for error in errors:
    print('ERROR:', error)

try:
    request = urllib.request.Request(
        'https://api.github.com/users/Dreams-Possible/repos?per_page=100&type=owner',
        headers={'User-Agent': 'Mathrix-blog-maintenance', 'Accept': 'application/vnd.github+json'},
    )
    with urllib.request.urlopen(request, timeout=15) as response:
        repositories = json.load(response)
    remote = {repo['name']: repo for repo in repositories if repo['name'] != 'Dreams-Possible.github.io'}
    missing = sorted(set(remote) - set(names))
    stale = sorted(set(names) - set(remote))
    changed = [(entry['name'], entry['date'], remote[entry['name']]['pushed_at'][:10])
               for entry in entries if entry['name'] in remote
               and entry['date'] != remote[entry['name']]['pushed_at'][:10]]
    print(f'Public project repositories: {len(remote)}')
    for name in missing:
        print('ADD:', name, remote[name]['html_url'])
    for name in stale:
        print('REVIEW missing on GitHub:', name)
    for name, local, current in changed:
        print(f'UPDATE DATE: {name}: {local} -> {current}')
    if missing or stale or changed:
        errors.append('Project list differs from GitHub')
except Exception as exc:
    print(f'GitHub comparison unavailable: {exc}', file=sys.stderr)
    print('Local validation completed; verify GitHub manually when available.')

sys.exit(1 if errors else 0)
