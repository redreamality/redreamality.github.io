import unittest

from normalize_name import normalize_name


class NormalizeNameTests(unittest.TestCase):
    def test_trim_and_collapse(self):
        self.assertEqual(normalize_name("  Ada   Lovelace  "), "Ada Lovelace")

    def test_empty(self):
        self.assertEqual(normalize_name(""), "")
        self.assertEqual(normalize_name(" \t\n "), "")

    def test_tabs_and_newlines(self):
        self.assertEqual(normalize_name("Ada\t \nLovelace"), "Ada Lovelace")

    def test_unicode_whitespace(self):
        self.assertEqual(normalize_name("Ada\u00a0\u3000Lovelace"), "Ada Lovelace")

    def test_preserve_unicode_text(self):
        self.assertEqual(normalize_name("\u5f20  \u4e09"), "\u5f20 \u4e09")

    def test_non_strings(self):
        for value in (None, 1, False, [], b"Ada"):
            with self.subTest(value=value), self.assertRaises(TypeError):
                normalize_name(value)

    def test_idempotent(self):
        result = normalize_name(" Ada \t Lovelace ")
        self.assertEqual(normalize_name(result), result)


if __name__ == "__main__":
    unittest.main()
