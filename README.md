# DSA Logic Visualizer

This small PHP + JS visualization shows many sorting algorithms with animations.

Files added

- `api/index.php` — main page/UI for the visualizer
- `assets/css/style.css` — styling for the page and bars
- `assets/js/visualizer.js` — algorithm implementations and animation driver

Algorithms included (labels in UI):

- selection sort
- binary insertion sort
- quick sort
- merge sort
- in-place merge sort
- heap sort
- tournament sort
- tree sort
- block sort (approx)
- smooth sort (approx)
- tim sort (simplified)
- patience sort
- intro sort

Notes

- Some advanced sorts (smooth sort, block sort) are provided as approximations for visualization purposes. They run a correct, visual, working sort but may not be the exact production-grade algorithm.
- The implementation strategy: algorithms return an "actions" list consumed by an animator. This keeps logic and UI loosely coupled and makes it easy to add new algorithms.

How to run

1. Serve the repository with a PHP-capable server. From the repository root (fish shell):

```fish
php -S 0.0.0.0:8000 -t .
```

2. Open http://localhost:8000/api/index.php in your browser.

Next steps (suggested)

- Add visual indicators for comparisons vs swaps (more distinct animations).
- Add step-by-step debugging mode and code view for each algorithm.
- Improve correctness/performance of advanced sorts (full TimSort, SmoothSort implementations).
