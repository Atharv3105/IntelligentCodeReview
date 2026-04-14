try {
    const sub = { problemId: null };
    const diff = sub.problemId?.difficulty?.toLowerCase() || 'easy';
    console.log("Diff:", diff);

    const sub2 = { problemId: { difficulty: "HARD" } };
    const diff2 = sub2.problemId?.difficulty?.toLowerCase() || 'easy';
    console.log("Diff2:", diff2);

    const sub3 = {};
    const diff3 = sub3.problemId?.difficulty?.toLowerCase() || 'easy';
    console.log("Diff3:", diff3);

    console.log("Success");
} catch (e) {
    console.log("Error:", e.message);
}
