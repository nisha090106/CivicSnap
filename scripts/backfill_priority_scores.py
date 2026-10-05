from pathlib import Path
import sys
import argparse


BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv

load_dotenv(BACKEND_DIR / ".env")

from database import SessionLocal
import models
from services.priority_service import compute_priority_score, recalculate_cluster_priority


def backfill_priority_scores(dry_run=True):
    db = SessionLocal()
    try:
        clusters = db.query(models.ReportCluster).order_by(
            models.ReportCluster.created_at.asc()
        ).all()
        failed_cluster_ids = []
        results = []

        for cluster in clusters:
            cluster_id = cluster.cluster_id
            previous_class = cluster.priority_class
            try:
                if dry_run:
                    score, priority_class, _breakdown, version = compute_priority_score(
                        cluster_id, db
                    )
                else:
                    updated_cluster = recalculate_cluster_priority(cluster_id, db)
                    score = updated_cluster.priority_score
                    priority_class = updated_cluster.priority_class
                    version = updated_cluster.score_version
                results.append({
                    "cluster_id": str(cluster_id),
                    "previous_class": previous_class,
                    "new_class": priority_class,
                    "score": score,
                    "version": version,
                })
            except Exception as error:
                failed_cluster_ids.append(str(cluster_id))
                print(f"[Priority Backfill Error] {cluster_id}: {error}")

        if failed_cluster_ids:
            raise RuntimeError(
                f"Priority backfill failed for {len(failed_cluster_ids)} clusters"
            )
        return results
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Recalculate priority classes and score explanations."
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Persist recalculated scores; default is a read-only dry run.",
    )
    arguments = parser.parse_args()
    dry_run = not arguments.apply
    rows = backfill_priority_scores(dry_run=dry_run)
    action = "Dry run (no database changes)" if dry_run else "Applied"
    print(f"{action}: recalculated {len(rows)} clusters.")
    print("cluster_id | previous_class | new_class | priority_score | score_version")
    for row in rows:
        print(
            f"{row['cluster_id']} | {row['previous_class'] or 'unset'} | "
            f"{row['new_class']} | {row['score']:.6f} | {row['version']}"
        )