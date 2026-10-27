"""Author-written reference implementation, not BMAD-generated output."""


def normalize_name(value):
    if not isinstance(value, str):
        raise TypeError("value must be a string")
    return " ".join(value.split())
