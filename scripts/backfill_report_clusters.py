from pathlib import Path
import sys


BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv

load_dotenv(BACKEND_DIR / ".env")

from database import SessionLocal
import models


def backfill_report_clusters():
    db = SessionLocal()
    try:
        unclustered_reports = db.query(models.Report).filter(
            models.Report.cluster_id.is_(None)
        ).order_by(models.Report.created_at.asc()).all()

        for report in unclustered_reports:
            report_cluster = models.ReportCluster(
                canonical_report_id=report.report_id,
                status="active",
            )
            db.add(report_cluster)
            db.flush()
            report.cluster_id = report_cluster.cluster_id
            db.flush()

        db.commit()
        return len(unclustered_reports)
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    created_count = backfill_report_clusters()
    print(f"Created singleton clusters for {created_count} reports.")