import unittest
import uuid
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import patch

from fastapi import HTTPException

import main


class FakeQuery:
    def __init__(self, item):
        self.item = item

    def filter(self, *_args):
        return self

    def with_for_update(self):
        return self

    def first(self):
        return self.item


class FakeDatabase:
    def __init__(self, report):
        self.report = report
        self.added = []
        self.commits = 0
        self.rollbacks = 0

    def query(self, _model):
        return FakeQuery(self.report)

    def add(self, item):
        self.added.append(item)

    def commit(self):
        self.commits += 1

    def refresh(self, item):
        if isinstance(item, main.models.ReportUpdate):
            item.report_update_id = item.report_update_id or uuid.uuid4()
            item.created_at = item.created_at or datetime.now(timezone.utc)

    def rollback(self):
        self.rollbacks += 1


def make_report(**overrides):
    values = {
        "report_id": uuid.uuid4(),
        "department": "Roads Department",
        "status": "Pending",
        "acknowledged_at": datetime.now(timezone.utc),
        "assigned_worker_name": None,
        "assigned_worker_contact": None,
        "resolution_photo_url": None,
        "cluster_id": None,
        "citizen_email": None,
        "citizen_id": None,
        "category": "Road Damage",
        "city_name": "Pune",
    }
    values.update(overrides)
    return SimpleNamespace(**values)


class AuthorityWorkTrackingTests(unittest.TestCase):
    def test_first_authority_view_acknowledges_report_once(self):
        report = make_report(acknowledged_at=None)
        db = FakeDatabase(report)
        authority = {"department": "Roads Department"}

        first = main.acknowledge_report(str(report.report_id), db, authority)
        acknowledged_at = report.acknowledged_at
        second = main.acknowledge_report(str(report.report_id), db, authority)

        self.assertEqual(first["status"], "Acknowledged")
        self.assertEqual(second["acknowledged_at"], acknowledged_at.isoformat())
        self.assertEqual(db.commits, 1)

    def test_authority_cannot_acknowledge_another_department_report(self):
        report = make_report(acknowledged_at=None)
        db = FakeDatabase(report)

        with self.assertRaises(HTTPException) as error:
            main.acknowledge_report(
                str(report.report_id),
                db,
                {"department": "Water Department"},
            )

        self.assertEqual(error.exception.status_code, 403)
        self.assertIsNone(report.acknowledged_at)

    def test_worker_assignment_starts_work_and_persists_contact(self):
        report = make_report()
        db = FakeDatabase(report)

        result = main.assign_report_worker(
            str(report.report_id),
            main.WorkerAssignmentRequest(
                worker_name="Ravi Kumar",
                worker_contact="555 0123",
            ),
            db,
            {"department": "Roads Department"},
        )

        self.assertEqual(result["status"], "In Progress")
        self.assertEqual(report.assigned_worker_name, "Ravi Kumar")
        self.assertEqual(report.assigned_worker_contact, "555 0123")
        self.assertEqual(db.commits, 1)

    def test_progress_updates_require_in_progress_and_keep_photo_history(self):
        report = make_report(status="Pending")
        db = FakeDatabase(report)
        request = main.ProgressUpdateRequest(image_data="data:image/jpeg;base64,cGhvdG8=", percentage=40)
        with patch.object(main, "upload_report_evidence", return_value="supabase://report-evidence/progress.jpg") as upload:
            with self.assertRaises(HTTPException) as error:
                main.add_report_progress(
                    str(report.report_id),
                    request,
                    db,
                    {"department": "Roads Department"},
                )

        self.assertEqual(error.exception.status_code, 409)
        upload.assert_not_called()

        report.status = "In Progress"
        with (
            patch.object(main, "upload_report_evidence", return_value="supabase://report-evidence/progress.jpg"),
            patch.object(main, "get_report_evidence_url", return_value="https://signed.example/progress.jpg"),
        ):
            result = main.add_report_progress(
                str(report.report_id),
                request,
                db,
                {"department": "Roads Department", "id": "authority-1"},
            )

        self.assertEqual(result["update"]["percentage"], 40)
        self.assertEqual(result["update"]["photo_url"], "https://signed.example/progress.jpg")
        self.assertEqual(db.added[0].update_type, "progress")
        self.assertEqual(db.commits, 1)

    def test_resolution_requires_proof_and_saves_photo_before_status(self):
        report = make_report(status="In Progress")
        db = FakeDatabase(report)
        authority = {"department": "Roads Department"}

        with self.assertRaises(HTTPException) as error:
            main.update_report_status(
                str(report.report_id),
                main.StatusUpdateRequest(status="Resolved"),
                db,
                authority,
            )

        self.assertEqual(error.exception.status_code, 400)
        self.assertEqual(report.status, "In Progress")
        self.assertEqual(db.commits, 0)

        with (
            patch.object(main, "upload_report_evidence", return_value="supabase://report-evidence/final.jpg"),
            patch.object(main, "get_report_evidence_url", return_value="https://signed.example/final.jpg"),
            patch.object(main, "send_status_update_notification_to_citizen", return_value=None),
        ):
            result = main.update_report_status(
                str(report.report_id),
                main.StatusUpdateRequest(
                    status="Resolved",
                    proof_photo_data="data:image/jpeg;base64,cGhvdG8=",
                ),
                db,
                authority,
            )

        self.assertEqual(result["status"], "Resolved")
        self.assertEqual(result["resolution_photo_url"], "https://signed.example/final.jpg")
        self.assertEqual(report.resolution_photo_url, "supabase://report-evidence/final.jpg")
        self.assertEqual(db.commits, 1)


if __name__ == "__main__":
    unittest.main()
