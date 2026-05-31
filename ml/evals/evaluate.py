# Runs the eval set through the RAG pipeline and measures recommendation accuracy
import json
import os
import sys
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from pipeline.rag import recommend

EVAL_SET_PATH = os.path.join(os.path.dirname(__file__), "eval_set.json")
CATEGORIES = ["frontend", "backend", "database", "auth", "deployment"]


def load_eval_set() -> list[dict]:
    with open(EVAL_SET_PATH, "r") as f:
        return json.load(f)

#compare reccomendations against expected per category
def score_case(actual: dict, expected: dict) -> dict:
    results = {}
    for cat in CATEGORIES:
        actual_choice = actual.get("recommendations", {}).get(cat, {}).get("choice", "")
        expected_choice = expected.get(cat, "")
        results[cat] = actual_choice == expected_choice
    results["score"] = sum(results[cat] for cat in CATEGORIES) / len(CATEGORIES)
    return results

#runs a single eval thru pipeline and scores it
def run_eval(case: dict) -> dict:
    print(f"  Running {case['id']}...")
    try:
        actual = recommend(case["description"])
        scores = score_case(actual, case["expected"])
        return {
            "id": case["id"],
            "description": case["description"],
            "expected": case["expected"],
            "actual": {cat: actual.get("recommendations", {}).get(cat, {}).get("choice", "") for cat in CATEGORIES},
            "scores": scores,
            "error": None,
        }
    except Exception as e:
        return {
            "id": case["id"],
            "description": case["description"],
            "expected": case["expected"],
            "actual": {},
            "scores": {**{cat: False for cat in CATEGORIES}, "score": 0.0},
            "error": str(e),
        }


def print_results(results: list[dict]) -> None:
    print("\n" + "=" * 60)
    print("EVAL RESULTS")
    print("=" * 60)

    category_totals = {cat: 0 for cat in CATEGORIES}
    overall_scores = []

    for r in results:
        status = "PASS" if r["scores"]["score"] == 1.0 else "FAIL"
        print(f"\n[{status}] {r['id']} — score: {r['scores']['score']:.0%}")

        if r["error"]:
            print(f"    ERROR: {r['error']}")
            continue

        for cat in CATEGORIES:
            passed = r["scores"][cat]
            mark = "PASS" if passed else "FAIL"
            actual = r["actual"].get(cat, "")
            expected = r["expected"].get(cat, "")
            if passed:
                print(f"    {mark} {cat}: {actual}")
            else:
                print(f"    {mark} {cat}: got '{actual}' - expected '{expected}'")
            if passed:
                category_totals[cat] += 1

        overall_scores.append(r["scores"]["score"])

    # Summary
    n = len(results)
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    for cat in CATEGORIES:
        pct = category_totals[cat] / n * 100
        print(f"  {cat:12s}: {category_totals[cat]}/{n} ({pct:.0f}%)")
    overall = sum(overall_scores) / len(overall_scores) * 100
    print(f"\n  Overall accuracy: {overall:.0f}%")
    print("=" * 60)


def run_all() -> None:
    cases = load_eval_set()
    print(f"Running {len(cases)} eval cases...\n")

    results = []
    for case in cases:
        result = run_eval(case)
        results.append(result)
        time.sleep(1) #req limit for groq

    print_results(results)

    #save results to file
    output_path = os.path.join(os.path.dirname(__file__), "eval_results.json")
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\nFull results saved to {output_path}")


if __name__ == "__main__":
    run_all()
