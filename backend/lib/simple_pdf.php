<?php
// A minimal, dependency-free single-page PDF writer.
// Sufficient for a text-based tabular attendance report (FR06); avoids
// pulling in a Composer dependency for a straightforward text layout.

function generate_simple_pdf(string $title, array $lines): string {
    $escape = fn($s) => str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $s);

    $content = "BT /F1 14 Tf 50 780 Td (" . $escape($title) . ") Tj ET\n";
    $y = 750;
    $content .= "BT /F1 9 Tf\n";
    foreach ($lines as $line) {
        $content .= "1 0 0 1 50 {$y} Tm (" . $escape($line) . ") Tj\n";
        $y -= 14;
        if ($y < 40) break; // single page is sufficient for this project's report sizes
    }
    $content .= "ET";

    $objects = [];
    $objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
    $objects[2] = "<< /Type /Pages /Kids [3 0 R] /Count 1 >>";
    $objects[3] = "<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 842] /Contents 5 0 R >>";
    $objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
    $objects[5] = "<< /Length " . strlen($content) . " >>\nstream\n{$content}\nendstream";

    $pdf = "%PDF-1.4\n";
    $offsets = [];
    foreach ($objects as $num => $body) {
        $offsets[$num] = strlen($pdf);
        $pdf .= "{$num} 0 obj\n{$body}\nendobj\n";
    }
    $xrefStart = strlen($pdf);
    $pdf .= "xref\n0 " . (count($objects) + 1) . "\n0000000000 65535 f \n";
    foreach ($objects as $num => $body) {
        $pdf .= str_pad((string) $offsets[$num], 10, '0', STR_PAD_LEFT) . " 00000 n \n";
    }
    $pdf .= "trailer\n<< /Size " . (count($objects) + 1) . " /Root 1 0 R >>\nstartxref\n{$xrefStart}\n%%EOF";

    return $pdf;
}
