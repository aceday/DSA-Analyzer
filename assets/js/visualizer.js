// DSA Logic Visualizer - JS
// This file implements many sorting algorithms and an animation driver.
(() => {
  const board = document.getElementById('board');
  const sizeControl = document.getElementById('size');
  const speedControl = document.getElementById('speed');
  const algoSelect = document.getElementById('algorithm');
  const shuffleBtn = document.getElementById('shuffle');
  const startBtn = document.getElementById('start');
  const stopBtn = document.getElementById('stop');

  let arr = [];
  let bars = [];
  let running = false;
  let speed = 120;
  let animationHandle = null;

  function makeArray(n){
    const a = Array.from({length:n}, (_,i)=>Math.floor((i+1)*1000/n));
    // shuffle
    for(let i=a.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]
    }
    return a;
  }

  function render(){
    board.innerHTML = '';
    bars = [];
    const max = Math.max(...arr.map(v=>Math.abs(v)),1);
    for(let i=0;i<arr.length;i++){
      const b = document.createElement('div');
      b.className = 'bar';
      b.style.height = Math.max(2, (arr[i]/max)*100) + '%';
      board.appendChild(b);
      bars.push(b);
    }
  }

  function updateBars(action){
    const {type,i,j,value} = action;
    if(type==='compare'){
      bars[i]?.classList.add('compare');
      if(typeof j==='number') bars[j]?.classList.add('compare');
    } else if(type==='swap'){
      // swap heights
      const hi = bars[i].style.height;
      bars[i].style.height = bars[j].style.height;
      bars[j].style.height = hi;
      bars[i]?.classList.add('swap');
      bars[j]?.classList.add('swap');
    } else if(type==='overwrite'){
      bars[i].style.height = Math.max(2, (value/1000)*100) + '%';
    } else if(type==='setSorted'){
      bars[i]?.classList.add('sorted');
    } else if(type==='clearCompare'){
      bars.forEach(b=>b.classList.remove('compare','swap'));
    }
  }

  function sleep(ms){
    return new Promise(r=>setTimeout(r, ms));
  }

  async function play(actions){
    running = true;
    const delay = () => Math.max(2, 1000 - speedControl.value);
    for(let k=0;k<actions.length && running;k++){
      updateBars(actions[k]);
      // small pause
      await sleep(delay());
      if(actions[k].type==='clearCompare') updateBars({type:'clearCompare'});
    }
    // mark sorted
    if(running){
      for(let i=0;i<bars.length;i++){
        bars[i].classList.add('sorted');
        await sleep(6);
      }
    }
    running = false;
  }

  // --- Algorithms: each returns an array of actions for animation ---

  function selectionSort(a){
    const actions = [];
    const n = a.length;
    for(let i=0;i<n-1;i++){
      let min=i;
      for(let j=i+1;j<n;j++){
        actions.push({type:'compare',i:min,j:j});
        if(a[j]<a[min]) min=j;
        actions.push({type:'clearCompare'});
      }
      if(min!==i){
        [a[i],a[min]]=[a[min],a[i]];
        actions.push({type:'swap',i:i,j:min});
        actions.push({type:'clearCompare'});
      }
      actions.push({type:'setSorted',i:i});
    }
    actions.push({type:'setSorted',i:n-1});
    return actions;
  }

  function binaryInsertionSort(a){
    const actions=[];
    for(let i=1;i<a.length;i++){
      let key = a[i];
      let lo=0,hi=i;
      while(lo<hi){
        const mid=(lo+hi)>>1;
        actions.push({type:'compare',i:mid,j:i});
        if(a[mid]<=key) lo=mid+1; else hi=mid;
        actions.push({type:'clearCompare'});
      }
      for(let j=i;j>lo;j--){
        a[j]=a[j-1];
        actions.push({type:'overwrite',i:j,value:a[j]});
      }
      a[lo]=key;
      actions.push({type:'overwrite',i:lo,value:key});
    }
    for(let i=0;i<a.length;i++) actions.push({type:'setSorted',i:i});
    return actions;
  }

  function quickSortDriver(a){
    const actions=[];
    function swap(i,j){[a[i],a[j]]=[a[j],a[i]];actions.push({type:'swap',i:i,j:j});actions.push({type:'clearCompare'});}
    function partition(l,r){
      const pivot=a[r];
      let i=l;
      for(let j=l;j<r;j++){
        actions.push({type:'compare',i:j,j:r});
        if(a[j]<pivot){swap(i,j);i++;}
        actions.push({type:'clearCompare'});
      }
      swap(i,r);
      return i;
    }
    function qs(l,r){
      if(l<r){
        const p=partition(l,r);
        qs(l,p-1);qs(p+1,r);
      }
    }
    qs(0,a.length-1);
    for(let i=0;i<a.length;i++) actions.push({type:'setSorted',i:i});
    return actions;
  }

  function mergeSortDriver(a){
    const actions=[];
    function merge(l, m, r){
      const left=a.slice(l,m+1);const right=a.slice(m+1,r+1);
      let i=0,j=0,k=l;
      while(i<left.length && j<right.length){
        actions.push({type:'compare',i:l+i,j:m+1+j});
        if(left[i]<=right[j]){a[k]=left[i];actions.push({type:'overwrite',i:k,value:left[i]});i++;}
        else{a[k]=right[j];actions.push({type:'overwrite',i:k,value:right[j]});j++;}
        k++;actions.push({type:'clearCompare'});
      }
      while(i<left.length){a[k]=left[i];actions.push({type:'overwrite',i:k,value:left[i]});i++;k++;}
      while(j<right.length){a[k]=right[j];actions.push({type:'overwrite',i:k,value:right[j]});j++;k++;}
    }
    function ms(l,r){if(l<r){const m=Math.floor((l+r)/2);ms(l,m);ms(m+1,r);merge(l,m,r);}}
    ms(0,a.length-1);
    for(let i=0;i<a.length;i++) actions.push({type:'setSorted',i:i});
    return actions;
  }

  // in-place merge using gap method
  function inPlaceMergeSortDriver(a){
    const actions=[];
    function gapMerge(l,m,r){
      let n = r-l+1; let gap = Math.ceil(n/2);
      while(gap>0){
        for(let i=l;i+gap<=r;i++){
          let j=i+gap; actions.push({type:'compare',i:i,j:j});
          if(a[i]>a[j]){[a[i],a[j]]=[a[j],a[i]];actions.push({type:'swap',i:i,j:j});}
          actions.push({type:'clearCompare'});
        }
        if(gap===1) break; gap=Math.ceil(gap/2);
      }
    }
    function ipms(l,r){
      if(l<r){const m=Math.floor((l+r)/2);ipms(l,m);ipms(m+1,r);gapMerge(l,m,r);}
    }
    ipms(0,a.length-1);
    for(let i=0;i<a.length;i++) actions.push({type:'setSorted',i:i});
    return actions;
  }

  function heapSortDriver(a){
    const actions=[];
    function heapify(n,i){
      let largest=i;let l=2*i+1;let r=2*i+2;
      if(l<n){actions.push({type:'compare',i:l,j:largest}); if(a[l]>a[largest]) largest=l; actions.push({type:'clearCompare'});} 
      if(r<n){actions.push({type:'compare',i:r,j:largest}); if(a[r]>a[largest]) largest=r; actions.push({type:'clearCompare'});} 
      if(largest!==i){[a[i],a[largest]]=[a[largest],a[i]];actions.push({type:'swap',i:i,j:largest});heapify(n,largest);}
    }
    const n=a.length;
    for(let i=Math.floor(n/2)-1;i>=0;i--) heapify(n,i);
    for(let i=n-1;i>0;i--){[a[0],a[i]]=[a[i],a[0]];actions.push({type:'swap',i:0,j:i});heapify(i,0);} 
    for(let i=0;i<n;i++) actions.push({type:'setSorted',i:i});
    return actions;
  }

  // tournament sort using a simple min-extract repeatedly
  function tournamentSortDriver(a){
    const actions=[];
    const n=a.length;
    const arrCopy = a.slice();
    const output = [];
    for(let t=0;t<n;t++){
      let minIdx=0;
      for(let i=1;i<arrCopy.length;i++){
        actions.push({type:'compare',i:minIdx,j:i});
        if(arrCopy[i]<arrCopy[minIdx]) minIdx=i;
        actions.push({type:'clearCompare'});
      }
      output.push(arrCopy[minIdx]);
      actions.push({type:'overwrite',i:t,value:arrCopy[minIdx]});
      arrCopy.splice(minIdx,1);
    }
    for(let i=0;i<n;i++) actions.push({type:'setSorted',i:i});
    // copy back to a (for correctness)
    for(let i=0;i<n;i++) a[i]=output[i];
    return actions;
  }

  // tree sort (BST) - naive, not balanced
  function treeSortDriver(a){
    const actions=[];
    function Node(v){this.v=v;this.left=null;this.right=null;}
    let root=null;
    function insert(node,v){
      if(!node) return new Node(v);
      actions.push({type:'compare',i:0,j:0}); actions.push({type:'clearCompare'});
      if(v<node.v) node.left=insert(node.left,v); else node.right=insert(node.right,v);
      return node;
    }
    for(const v of a) root=insert(root,v);
    const out=[];
    function inorder(n){
      if(!n) return;
      inorder(n.left); out.push(n.v); inorder(n.right);
    }
    inorder(root);
    for(let i=0;i<out.length;i++){a[i]=out[i]; actions.push({type:'overwrite',i:i,value:out[i]});}
    for(let i=0;i<a.length;i++) actions.push({type:'setSorted',i:i});
    return actions;
  }

  // simplified timsort: find runs, insertion sort runs, then merge
  function timSortDriver(a){
    const actions=[];
    const n=a.length; const MIN_RUN=32;
    function insertionSortSegment(l,r){
      for(let i=l+1;i<=r;i++){
        const key=a[i]; let j=i-1; while(j>=l && a[j]>key){actions.push({type:'compare',i:j,j:i});a[j+1]=a[j];actions.push({type:'overwrite',i:j+1,value:a[j+1]});j--;actions.push({type:'clearCompare'});} a[j+1]=key;actions.push({type:'overwrite',i:j+1,value:key});
      }
    }
    // make runs
    let runs=[]; let i=0;
    while(i<n){
      let j=i+1;
      if(j===n){runs.push([i,i]);break}
      if(a[j]>=a[j-1]){while(j<n && a[j]>=a[j-1])j++;} else {while(j<n && a[j]<a[j-1])j++; a.splice(i,j-i, ...a.slice(i,j).reverse());}
      const runLen=j-i; if(runLen<MIN_RUN){const force=Math.min(MIN_RUN, n-i); insertionSortSegment(i,i+force-1); runs.push([i,i+force-1]); i += force;} else {insertionSortSegment(i,j-1); runs.push([i,j-1]); i=j;}
    }
    // merge runs pairwise
    function merge(l,m,r){
      const left=a.slice(l,m+1);
      const right=a.slice(m+1,r+1);
      let p=0, q=0, k=l;
      while(p<left.length && q<right.length){
        actions.push({type:'compare',i:l+p,j:m+1+q});
        if(left[p] <= right[q]){
          a[k] = left[p];
          actions.push({type:'overwrite', i:k, value:left[p]});
          p++;
        } else {
          a[k] = right[q];
          actions.push({type:'overwrite', i:k, value:right[q]});
          q++;
        }
        k++;
        actions.push({type:'clearCompare'});
      }
      while(p<left.length){
        a[k] = left[p];
        actions.push({type:'overwrite', i:k, value:left[p]});
        p++; k++;
      }
      while(q<right.length){
        a[k] = right[q];
        actions.push({type:'overwrite', i:k, value:right[q]});
        q++; k++;
      }
    }
    // now merge sequentially until single run
    while(runs.length>1){
      const aRuns = [];
      for(let k=0;k<runs.length;k+=2){
        if(k+1<runs.length){
          const [l1,r1]=runs[k]; const [l2,r2]=runs[k+1]; merge(l1,r1,r2); aRuns.push([l1,r2]);
        } else aRuns.push(runs[k]);
      }
      runs = aRuns;
    }
    for(let t=0;t<n;t++) actions.push({type:'setSorted',i:t});
    return actions;
  }

  // patience sort: build piles and reconstruct
  function patienceSortDriver(a){
    const actions=[];
    const piles = [];
    const n=a.length;
    for(let i=0;i<n;i++){
      let x=a[i];
      // binary search for pile
      let lo=0,hi=piles.length;
      while(lo<hi){const m=(lo+hi)>>1; actions.push({type:'compare',i:m,j:i}); if(piles[m][piles[m].length-1] < x) lo=m+1; else hi=m; actions.push({type:'clearCompare'});}
      if(lo===piles.length) piles.push([]);
      piles[lo].push(x);
    }
    // reconstruct by extracting smallest from pile tops using a simple merge
    const out=[];
    while(piles.length){
      let minIdx=0; for(let i=1;i<piles.length;i++){ actions.push({type:'compare',i:i,j:minIdx}); if(piles[i][piles[i].length-1] < piles[minIdx][piles[minIdx].length-1]) minIdx=i; actions.push({type:'clearCompare'});}
      out.push(piles[minIdx].pop()); if(piles[minIdx].length===0)piles.splice(minIdx,1);
    }
    // out is descending; reverse
    out.reverse();
    for(let i=0;i<n;i++){a[i]=out[i]; actions.push({type:'overwrite',i:i,value:out[i]});}
    for(let i=0;i<n;i++) actions.push({type:'setSorted',i:i});
    return actions;
  }

  // intro sort: quick sort with depth limit then heap
  function introSortDriver(a){
    const actions=[];
    const n=a.length; const maxDepth = 2*Math.floor(Math.log2(Math.max(2,n)));
    function swap(i,j){[a[i],a[j]]=[a[j],a[i]];actions.push({type:'swap',i:i,j:j});actions.push({type:'clearCompare'});}
    function heapify(n,i){
      let largest = i;
      let l = 2*i + 1;
      let r = 2*i + 2;
      if(l < n){
        actions.push({type:'compare', i:l, j:largest});
        if(a[l] > a[largest]) largest = l;
        actions.push({type:'clearCompare'});
      }
      if(r < n){
        actions.push({type:'compare', i:r, j:largest});
        if(a[r] > a[largest]) largest = r;
        actions.push({type:'clearCompare'});
      }
      if(largest !== i){
        swap(i, largest);
        heapify(n, largest);
      }
    }
    function heapsort(){for(let i=Math.floor(n/2)-1;i>=0;i--) heapify(n,i); for(let i=n-1;i>0;i--){swap(0,i);heapify(i,0);} }
    function qs(l,r,depth){
      if(l>=r) return; if(depth>maxDepth){heapsort(); return;} const pivot=a[Math.floor((l+r)/2)]; let i=l,j=r; while(i<=j){while(a[i]<pivot){actions.push({type:'compare',i:i,j:r});i++;actions.push({type:'clearCompare'});} while(a[j]>pivot){actions.push({type:'compare',i:j,j:l});j--;actions.push({type:'clearCompare'});} if(i<=j){swap(i,j);i++;j--;}} if(l<j) qs(l,j,depth+1); if(i<r) qs(i,r,depth+1);
    }
    qs(0,n-1,0);
    for(let i=0;i<n;i++) actions.push({type:'setSorted',i:i});
    return actions;
  }

  // For complex/rare sorts we use approximations when necessary (block/smooth)
  function smoothSortDriver(a){
    // approximate with heap sort for visualization
    return heapSortDriver(a);
  }
  function blockSortDriver(a){
    // approximate with timsort
    return timSortDriver(a);
  }

  const algos = {
    'selection sort': selectionSort,
    'binary insertion sort': binaryInsertionSort,
    'quick sort': quickSortDriver,
    'merge sort': mergeSortDriver,
    'in-place merge sort': inPlaceMergeSortDriver,
    'heap sort': heapSortDriver,
    'tournament sort': tournamentSortDriver,
    'tree sort': treeSortDriver,
    'block sort (approx)': blockSortDriver,
    'smooth sort (approx)': smoothSortDriver,
    'tim sort (simplified)': timSortDriver,
    'patience sort': patienceSortDriver,
    'intro sort': introSortDriver,
  };

  // wire up buttons
  function reset(){
    arr = makeArray(parseInt(sizeControl.value,10));
    render();
  }

  shuffleBtn.addEventListener('click', ()=>{ reset(); });
  sizeControl.addEventListener('input', ()=>{ reset(); });
  startBtn.addEventListener('click', async ()=>{
    if(running) return; // no double start
    const key = algoSelect.value;
    const fn = algos[key];
    if(!fn) return alert('Algorithm not found: '+key);
    // make a copy for algorithm so original arr modified for animation
    const work = arr.slice();
    const actions = fn(work);
    await play(actions);
  });
  stopBtn.addEventListener('click', ()=>{ running=false; });

  // init
  reset();
  // expose for debugging
  window.DSAV = {reset,render};
})();
