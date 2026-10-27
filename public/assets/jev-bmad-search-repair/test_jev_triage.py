import copy
import unittest
import urllib.error
from unittest.mock import Mock, patch

from jev_triage import FIXTURE, REQUEST, fixtures, route, validate_request, validate_response


class TriageTests(unittest.TestCase):
    def test_fixture_routes(self):
        self.assertEqual(
            [route(transport) for _, transport in fixtures()],
            [
                {"queue": "billing", "reason": "classified"},
                {"queue": "manual", "reason": "low-confidence"},
                {"queue": "manual", "reason": "invalid-response"},
                {"queue": "manual", "reason": "transport-error"},
            ],
        )

    def test_request_contract(self):
        validate_request(REQUEST)
        malformed = [
            {},
            {**REQUEST, "model": ""},
            {**REQUEST, "state": {"message": "", "ticket_id": "demo"}},
            {**REQUEST, "questions": {"department": {"type": "noul"}}},
        ]
        for request in malformed:
            with self.subTest(request=request), self.assertRaises(ValueError):
                validate_request(request)
        transport = Mock()
        with patch.dict(REQUEST, {"model": ""}):
            self.assertEqual(route(transport), {"queue": "manual", "reason": "invalid-request"})
        transport.assert_not_called()
        def inspect(request):
            self.assertEqual(request, REQUEST)
            self.assertEqual(request["questions"]["department"]["type"], "choice")
            return copy.deepcopy(FIXTURE)
        self.assertEqual(route(inspect)["queue"], "billing")

    def test_reject_invalid_answers(self):
        mutations = [
            {"choice": "refund-executed"},
            {"choice": []},
            {"type": "noul"},
            {"confidence": None},
            {"confidence": True},
            {"confidence": float("nan")},
            {"confidence": float("inf")},
            {"confidence": 10**1000},
            {"confidence": -(10**1000)},
            {"confidence": 1.1},
            {"probabilities": {"billing": 1.0}},
            {"probabilities": {"billing": 0.2, "shipping": 0.2, "other": 0.2}},
            {"probabilities": {"billing": 0.1, "shipping": 0.9, "other": 0}},
            {"probabilities": {"billing": 10**1000, "shipping": 0, "other": 0}},
        ]
        for mutation in mutations:
            with self.subTest(mutation=mutation):
                result = copy.deepcopy(FIXTURE)
                result["answers"]["department"].update(mutation)
                self.assertEqual(
                    route(lambda _: result),
                    {"queue": "manual", "reason": "invalid-response"},
                )

    def test_reject_invalid_envelopes(self):
        for result in (None, [], {}, {"model": "x", "answers": []}):
            with self.subTest(result=result), self.assertRaises(ValueError):
                validate_response(result)
        result = copy.deepcopy(FIXTURE)
        result["usage"]["input_tokens"] = True
        self.assertEqual(route(lambda _: result)["reason"], "invalid-response")

    def test_http_failures(self):
        for status in (401, 429, 500):
            def fail(_, status=status):
                raise urllib.error.HTTPError("fixture", status, "Synthetic", {}, None)
            self.assertEqual(route(fail), {"queue": "manual", "reason": f"http-{status}"})

    def test_malformed_json(self):
        import json
        self.assertEqual(
            route(lambda _: json.loads("{")),
            {"queue": "manual", "reason": "invalid-response"},
        )

    def test_other_is_manual(self):
        result = copy.deepcopy(FIXTURE)
        result["answers"]["department"].update(
            choice="other", probabilities={"billing": 0, "shipping": 0, "other": 1}
        )
        self.assertEqual(route(lambda _: result), {"queue": "manual", "reason": "other"})


if __name__ == "__main__":
    unittest.main()
