def test_clean_and_parse_json():
    import json
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
    
    # Test Case 5: Malformed JSON (should raise JSONDecodeError)
    malformed_json = '{"key": "value"'
    try:
        clean_and_parse_json(malformed_json)
        print("❌ Test Case 5 Failed: Should have raised JSONDecodeError")
    except json.JSONDecodeError:
        print("✅ Test Case 5 Passed: Malformed JSON raised error")

    print("\nAll tests passed!")

if __name__ == "__main__":
    test_clean_and_parse_json()
