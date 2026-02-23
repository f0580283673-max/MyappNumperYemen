class NumberFormatter {
  static String format(String number) {
    String clean = number.replaceAll(RegExp(r'\D'), '');
    if (clean.startsWith('967')) clean = clean.substring(3);
    if (clean.startsWith('00')) clean = clean.substring(2);
    if (clean.startsWith('0')) clean = clean.substring(1);
    if (clean.length > 9) clean = clean.substring(clean.length - 9);
    return clean;
  }
}