import tempfile
import unittest
from pathlib import Path
import controller


class ControllerTests(unittest.TestCase):
    def test_starts_off_when_no_cache(self):
        with tempfile.TemporaryDirectory() as d:
            rev, state = controller.load_cache(Path(d) / "missing.json")
            self.assertEqual(rev, 0)
            self.assertFalse(state["on"])

    def test_restores_cached_state_after_reboot(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "state.json"
            s = controller.validate_state({"on": False, "effect": "solid", "hue": 20, "sat": 80, "brightness": 50, "speed": 40})
            controller.save_cache_atomic(p, 7, s)
            rev, restored = controller.load_cache(p)
            self.assertEqual(rev, 7)
            self.assertFalse(restored["on"])

    def test_ignores_duplicate_or_older_revisions(self):
        self.assertFalse(controller.should_apply_revision(5, 5))
        self.assertFalse(controller.should_apply_revision(5, 4))
        self.assertTrue(controller.should_apply_revision(5, 6))

    def test_rejects_invalid_effect_and_range(self):
        with self.assertRaises(ValueError):
            controller.validate_state({"effect": "shell_exec"})
        with self.assertRaises(ValueError):
            controller.validate_state({"effect": "solid", "brightness": 150})


if __name__ == "__main__":
    unittest.main()
