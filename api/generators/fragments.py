"""Fragment-and-merge for composed manifest files (Generation Engine v2, pillar 2).

Each snippet contributes a *fragment* of a shared file; the composer merges the
fragments into one file. This mirrors how `.env` already merges per-tech
`env_vars.txt` (`shared_generator._split_env`). It replaces the old whole-file
override approach (e.g. the Mongo combo overwriting the entire server
`package.json`), which could not stack with add-ons.

Three mergers, one per shared file type:
- `merge_package_json` -- deep-merge; dependency maps merged + sorted, `scripts`
  merged preserving insertion order (base first, then fragments).
- `merge_requirements` -- union of pinned lines, de-duplicated by package name,
  order preserved (base first, then fragments).
- `merge_tsconfig` -- deep-merge of `compilerOptions`; arrays unioned.

Merging only happens when there is something to merge -- callers emit a single
file as-is when it has no fragments, so byte output is unchanged for stacks that
don't actually compose that file (keeps the verified combos identical).
"""
import json
import re
from collections import OrderedDict
from typing import Any

# Dependency maps are sorted on output (npm doesn't care about order, and the
# existing hand-written templates list deps alphabetically -- matching keeps the
# generated output stable and diff-clean).
_SORTED_KEYS = ("dependencies", "devDependencies", "peerDependencies")


def _deep_merge(base: Any, patch: Any) -> Any:
    """Recursively merge patch into base. Dicts merge key-wise (patch order is
    appended after base order); non-dict values are replaced by patch."""
    if isinstance(base, dict) and isinstance(patch, dict):
        merged = OrderedDict(base)
        for key, value in patch.items():
            if key in merged:
                merged[key] = _deep_merge(merged[key], value)
            else:
                merged[key] = value
        return merged
    return patch


def merge_package_json(base: str, *fragments: str) -> str:
    """Merge a base package.json with zero or more fragment JSON strings.

    Dependency maps are merged and alphabetically sorted; `scripts` (and any
    other object) keep base-then-fragment insertion order.
    """
    result: Any = json.loads(base, object_pairs_hook=OrderedDict)
    for frag in fragments:
        if not frag.strip():
            continue
        result = _deep_merge(result, json.loads(frag, object_pairs_hook=OrderedDict))

    for key in _SORTED_KEYS:
        if isinstance(result.get(key), dict):
            result[key] = OrderedDict(sorted(result[key].items()))

    return json.dumps(result, indent=2) + "\n"


def merge_requirements(base: str, *fragments: str) -> str:
    """Union of requirement lines, de-duplicated by (normalised) package name.

    Comments and blank lines from the base are preserved; fragment comments are
    dropped (fragments are additive dependency lists). Order is base lines first,
    then any new packages contributed by fragments.
    """
    seen: set[str] = set()
    out: list[str] = []

    def pkg_name(line: str) -> str:
        # strip extras/version specifiers: "uvicorn[standard]==0.34.0" -> "uvicorn"
        return re.split(r"[\[=<>~!;\s]", line, maxsplit=1)[0].strip().lower()

    # Base: keep everything (incl. comments/blanks), track package names.
    for line in base.splitlines():
        stripped = line.rstrip()
        if stripped and not stripped.lstrip().startswith("#"):
            seen.add(pkg_name(stripped))
        out.append(stripped)

    # Fragments: append only previously-unseen packages.
    for frag in fragments:
        for line in frag.splitlines():
            stripped = line.rstrip()
            if not stripped or stripped.lstrip().startswith("#"):
                continue
            name = pkg_name(stripped)
            if name not in seen:
                seen.add(name)
                out.append(stripped)

    return "\n".join(out) + "\n"


def merge_tsconfig(base: str, *fragments: str) -> str:
    """Deep-merge tsconfig JSON. `compilerOptions` merge key-wise; list values
    (e.g. `include`, `lib`, `types`) are unioned preserving order."""
    def union_lists(a: Any, b: Any) -> Any:
        if isinstance(a, list) and isinstance(b, list):
            merged = list(a)
            for item in b:
                if item not in merged:
                    merged.append(item)
            return merged
        return _deep_merge(a, b)

    result: Any = json.loads(base, object_pairs_hook=OrderedDict)
    for frag in fragments:
        if not frag.strip():
            continue
        patch = json.loads(frag, object_pairs_hook=OrderedDict)
        for key, value in patch.items():
            if key in result:
                result[key] = union_lists(result[key], value)
            else:
                result[key] = value

    return json.dumps(result, indent=2) + "\n"
