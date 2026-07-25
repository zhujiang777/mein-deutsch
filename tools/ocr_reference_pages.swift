#!/usr/bin/env swift
import AppKit
import Foundation
import PDFKit
import Vision

func fail(_ message: String) -> Never {
    FileHandle.standardError.write(Data((message + "\n").utf8))
    exit(1)
}

func pageIndexes(_ spec: String, count: Int) -> [Int] {
    var result = Set<Int>()
    for part in spec.split(separator: ",") {
        let bounds = part.split(separator: "-", maxSplits: 1).compactMap { Int($0) }
        guard let first = bounds.first else { continue }
        let last = bounds.count == 2 ? bounds[1] : first
        for page in min(first, last)...max(first, last) where page >= 1 && page <= count {
            result.insert(page - 1)
        }
    }
    return result.sorted()
}

guard CommandLine.arguments.count == 4 else {
    fail("Usage: swift tools/ocr_reference_pages.swift <pdf> <pages e.g. 3-8,11> <output.txt>")
}

let pdfURL = URL(fileURLWithPath: CommandLine.arguments[1])
let outputURL = URL(fileURLWithPath: CommandLine.arguments[3])
guard let document = PDFDocument(url: pdfURL) else { fail("Cannot open PDF: \(pdfURL.path)") }
let indexes = pageIndexes(CommandLine.arguments[2], count: document.pageCount)
guard !indexes.isEmpty else { fail("No valid pages selected") }

try FileManager.default.createDirectory(
    at: outputURL.deletingLastPathComponent(),
    withIntermediateDirectories: true
)

var blocks: [String] = []
for index in indexes {
    autoreleasepool {
        guard let page = document.page(at: index) else { return }
        let bounds = page.bounds(for: .mediaBox)
        let scale: CGFloat = 2.0
        let width = Int(bounds.width * scale)
        let height = Int(bounds.height * scale)
        guard let context = CGContext(
            data: nil,
            width: width,
            height: height,
            bitsPerComponent: 8,
            bytesPerRow: 0,
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        ) else { return }
        context.setFillColor(NSColor.white.cgColor)
        context.fill(CGRect(x: 0, y: 0, width: width, height: height))
        context.saveGState()
        context.scaleBy(x: scale, y: scale)
        page.draw(with: .mediaBox, to: context)
        context.restoreGState()
        guard let image = context.makeImage() else { return }

        let request = VNRecognizeTextRequest()
        request.recognitionLevel = .accurate
        request.recognitionLanguages = ["de-DE", "en-US"]
        request.usesLanguageCorrection = true
        do {
            try VNImageRequestHandler(cgImage: image).perform([request])
            let lines = (request.results ?? [])
                .compactMap { $0.topCandidates(1).first?.string }
            blocks.append("=== PDF page \(index + 1) ===\n" + lines.joined(separator: "\n"))
        } catch {
            fail("OCR failed on page \(index + 1): \(error)")
        }
    }
}

try blocks.joined(separator: "\n\n").write(to: outputURL, atomically: true, encoding: .utf8)
print("Wrote \(indexes.count) OCR pages to \(outputURL.path)")
