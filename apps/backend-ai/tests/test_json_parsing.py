def test_clean_and_parse_json():
    import json
    import sys
    import os
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
    from main import clean_and_parse_json

    print("Running tests for clean_and_parse_json...")

    # Test Case 1: Valid JSON
    valid_json = '{"key": "value"}'
    assert clean_and_parse_json(valid_json) == {"key": "value"}
    print("✅ Test Case 1 Passed: Valid JSON")

    # Test Case 2: JSON with markdown block (json)
    markdown_json = '```json\n{"key": "value"}\n```'
    assert clean_and_parse_json(markdown_json) == {"key": "value"}
    print("✅ Test Case 2 Passed: JSON with markdown block (json)")

    # Test Case 3: JSON with markdown block (no language)
    markdown_no_lang = '```\n{"key": "value"}\n```'
    assert clean_and_parse_json(markdown_no_lang) == {"key": "value"}
    print("✅ Test Case 3 Passed: JSON with markdown block (no language)")

    # Test Case 4: JSON with surrounding text/whitespace
    surrounding_text = 'Here is the JSON:\n```json\n{"key": "value"}\n```'
    assert clean_and_parse_json(surrounding_text) == {"key": "value"}
    print("✅ Test Case 4 Passed: JSON with surrounding text")
    

    # Test Case 5: Malformed JSON (should raise ValueError)
    malformed_json = '{"key": "value"'
    try:
        clean_and_parse_json(malformed_json)
        print("❌ Test Case 5 Failed: Should have raised ValueError")
    except ValueError as e:
        assert str(e) == "Failed to parse AI response" or "No JSON start found" in str(e)
        print(f"✅ Test Case 5 Passed: Malformed JSON raised expected ValueError: {e}")

    # Test Case 6: Truncated JSON recovery (Brace Counting)
    # The new logic should be able to extract the valid part if it's a "I do not recommend..." loop appended
    loop_text = '{"rating": 5, "summary": "Good."} I do not recommend I do not recommend'
    assert clean_and_parse_json(loop_text) == {"rating": 5, "summary": "Good."}
    print("✅ Test Case 6 Passed: Truncated/Loop recovery")

    print("\nAll tests passed!")

if __name__ == "__main__":
    test_clean_and_parse_json()


if __name__ == "__main__":
    test_clean_and_parse_json()
