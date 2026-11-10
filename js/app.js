(function(){
        "use strict";
        function $(id){return document.getElementById(id);}
        function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}

        /* ---------- case picker ---------- */
        var picks=document.querySelectorAll(".case-pick");
        picks.forEach(function(b){
          b.addEventListener("click",function(){
            var sel=$("f-type"), val=b.getAttribute("data-case-type");
            for(var i=0;i<sel.options.length;i++){ if(sel.options[i].text===val){ sel.selectedIndex=i; break; } }
            document.getElementById("case").scrollIntoView({behavior:"smooth"});
          });
        });

        /* ---------- safety filter ---------- */
        var STOP={the:1,and:1,or:1,but:1,if:1,then:1,than:1,so:1,as:1,at:1,by:1,for:1,with:1,from:1,on:1,in:1,is:1,are:1,was:1,were:1,be:1,been:1,it:1,its:1,this:1,that:1,these:1,those:1,you:1,he:1,she:1,we:1,they:1,my:1,your:1,his:1,her:1,our:1,their:1,me:1,him:1,us:1,them:1,not:1,no:1,do:1,does:1,did:1,have:1,has:1,had:1,will:1,would:1,should:1,could:1,may:1,might:1,must:1,now:1,when:1,what:1,where:1,who:1,how:1,why:1,which:1,there:1,here:1,very:1,just:1,only:1,an:1,am:1,im:1,ive:1,dont:1,cant:1,wont:1};
        function secretProblem(text){
          if(!text) return null;
          if(/\b[5KL][1-9A-HJ-NP-Za-km-z]{50,51}\b/.test(text)) return "That looks like a private key. Remove it — we never need it, and sharing it anywhere can empty your wallet.";
          /* A recovery phrase is 12+ short words in a row with no ordinary
             sentence words (the, and, was, will…) among them. Normal prose
             cannot run that long without one, so this does not block stories. */
          var words=text.toLowerCase().replace(/[^a-z\s]/g," ").split(/\s+/).filter(Boolean);
          var run=0,best=0;
          for(var i=0;i<words.length;i++){
            var w=words[i];
            if(/^[a-z]{3,8}$/.test(w)&&!STOP[w]){ run++; if(run>best)best=run; } else run=0;
          }
          if(best>=12) return "That looks like it could be a recovery phrase (12 or more wallet words in a row). Remove it and only tell us HOW MANY words you have or are missing — never the words themselves.";
          return null;
        }
        function storyCodeProblem(text){
          if(text&&/\b[0-9a-fA-F]{64}\b/.test(text)) return "Your story contains a long 64-character code. If it is a transaction ID, move it to the transaction ID field above. If it is a private key, delete it — never share it anywhere.";
          return null;
        }

        /* ---------- case form ---------- */
        var summaryText="";
        $("case-form").addEventListener("submit",function(e){
          e.preventDefault();
          var err=$("case-error"); err.style.display="none";
          var type=$("f-type").value, asset=$("f-asset").value.trim(), amount=$("f-amount").value.trim(),
              when=$("f-when").value.trim(), txid=$("f-txid").value.trim(), story=$("f-story").value.trim(),
              name=$("f-name").value.trim(), email=$("f-email").value.trim();
          var problem=secretProblem(story)||storyCodeProblem(story)||secretProblem(asset)||secretProblem(amount);
          if(problem){ err.textContent="Case blocked for your safety: "+problem; err.style.display="block"; err.scrollIntoView({behavior:"smooth",block:"center"}); return; }
          if(story.length<20){ err.textContent="Please describe what happened in a sentence or two — your own words are enough."; err.style.display="block"; return; }
          if(!name){ err.textContent="Please add your name so we know who the case belongs to."; err.style.display="block"; return; }
          if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ err.textContent="Please add a valid email — that's where our reply goes."; err.style.display="block"; return; }
          var ref="CG-"+new Date().getFullYear()+"-"+Math.floor(1000+Math.random()*9000);
          summaryText=
            "CHAINGUARD RECOVERY — CASE SUMMARY\n"+
            "Reference: "+ref+"\n"+
            "Date prepared: "+new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})+"\n\n"+
            "Case type: "+type+"\n"+
            "Coin / wallet app: "+(asset||"not stated")+"\n"+
            "Amount involved: "+(amount||"not stated")+"\n"+
            "When it happened: "+(when||"not stated")+"\n"+
            "Transaction ID / address: "+(txid||"not provided")+"\n\n"+
            "What happened:\n"+story+"\n\n"+
            "Name: "+name+"\nReply email: "+email+"\n\n"+
            "Safety confirmation: this summary contains no recovery phrase, private key, or password.";
          $("case-ref").textContent=ref;
          $("case-summary-text").textContent=summaryText;
          $("case-summary").classList.add("show");
          $("case-summary").scrollIntoView({behavior:"smooth",block:"center"});
        });
        $("case-download").addEventListener("click",function(){
          if(!summaryText) return;
          var blob=new Blob([summaryText],{type:"text/plain"});
          var a=document.createElement("a");
          a.href=URL.createObjectURL(blob);
          a.download="chainguard-case-"+$("case-ref").textContent+".txt";
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(function(){URL.revokeObjectURL(a.href);},2000);
        });
        $("case-copy").addEventListener("click",function(){
          if(!summaryText) return;
          function done(){ $("case-copy-note").style.display="block"; }
          if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(summaryText).then(done,done); }
          else{
            var ta=document.createElement("textarea"); ta.value=summaryText; document.body.appendChild(ta); ta.select();
            try{document.execCommand("copy");}catch(e){}
            ta.remove(); done();
          }
        });

        /* ---------- free trace ---------- */
        function hopHtml(n,label,addr,sub){
          return '<div class="hop"><span class="n">'+n+'</span><div><strong>'+esc(label)+'</strong><br/><span class="mono" style="text-transform:none;letter-spacing:0;font-size:.82rem">'+esc(addr)+'</span>'+(sub?'<small>'+sub+'</small>':"")+"</div></div>";
        }
        function traceError(box,msg,links){
          box.innerHTML='<div class="err"><strong>We couldn\'t complete that trace.</strong><br/>'+esc(msg)+(links?'<br/><br/>'+links:"")+"</div>";
          box.classList.add("show");
        }
        function btcTraceUrl(h){return "https://mempool.space/tx/"+encodeURIComponent(h);}

        async function traceBtc(box,hash){
          var hops=[], current=hash, seen={}, guard=0;
          while(guard<6){
            guard++;
            var tx;
            try{
              var r=await fetch("https://mempool.space/api/tx/"+encodeURIComponent(current));
              if(!r.ok) throw new Error("notfound");
              tx=await r.json();
            }catch(e){
              if(guard===1){ traceError(box,"That transaction ID wasn't found on the Bitcoin network. Check for typos, and make sure the chain matches the coin you sent.",'<a href="'+btcTraceUrl(hash)+'" target="_blank" rel="noopener">Try it on mempool.space</a>'); return; }
              break;
            }
            var outs=(tx.vout||[]).filter(function(o){return o.scriptpubkey_address;});
            if(!outs.length) break;
            outs.sort(function(a,b){return b.value-a.value;});
            var top=outs[0], addr=top.scriptpubkey_address;
            hops.push({txid:current,to:addr,btc:(top.value/1e8).toFixed(8).replace(/0+$/,"").replace(/\.$/,".0")});
            if(seen[addr]) break; seen[addr]=1;
            var next=null;
            try{
              var r2=await fetch("https://mempool.space/api/address/"+encodeURIComponent(addr)+"/txs");
              if(r2.ok){
                var list=await r2.json();
                for(var i=0;i<list.length;i++){
                  var t=list[i], spends=(t.vin||[]).some(function(v){return v.prevout&&v.prevout.scriptpubkey_address===addr;});
                  if(spends){ next=t.txid; break; }
                }
              }
            }catch(e){}
            if(!next) break;
            current=next;
          }
          if(!hops.length){ traceError(box,"No spendable outputs were found for that transaction, so there is no trail to follow yet."); return; }
          var html='<h3 style="margin-bottom:14px">Trace result — Bitcoin</h3>';
          hops.forEach(function(h,i){
            html+=hopHtml(i+1,(i===0?"Your transaction sent the largest share to":"Then moved on to"),h.to,h.btc+" BTC · tx "+h.txid.slice(0,18)+"… · "+'<a href="'+btcTraceUrl(h.txid)+'" target="_blank" rel="noopener">view transaction</a>');
          });
          var last=hops[hops.length-1];
          html+='<p class="tool-note">The trail currently ends at <span class="mono" style="text-transform:none;letter-spacing:0;font-size:.82rem">'+esc(last.to)+'</span> — no onward transfer from that address was found in its recent history. If that address belongs to an exchange, a report can ask the exchange to act. <a href="#case">Open a case</a> for a full investigation.</p>';
          box.innerHTML=html; box.classList.add("show");
        }

        async function traceEth(box,hash){
          try{
            var r=await fetch("https://api.blockcypher.com/v1/eth/main/txs/"+encodeURIComponent(hash));
            if(!r.ok) throw new Error("nf");
            var tx=await r.json();
            var outs=tx.outputs||[];
            if(!outs.length) throw new Error("nf");
            outs.sort(function(a,b){return b.value-a.value;});
            var top=outs[0], to=(top.addresses&&top.addresses[0])||"unknown";
            var eth=(top.value/1e18);
            var html='<h3 style="margin-bottom:14px">Trace result — Ethereum</h3>';
            html+=hopHtml(1,"Largest transfer in this transaction went to",to,eth.toFixed(6)+" ETH · block "+(tx.block_height||"pending"));
            html+='<p class="tool-note">Full multi-hop Ethereum tracing — including token transfers — is done as part of a case review. <a href="#case">Open a case</a> and include this transaction ID. <a href="https://etherscan.io/tx/'+esc(hash)+'" target="_blank" rel="noopener">View on Etherscan</a></p>';
            box.innerHTML=html; box.classList.add("show");
          }catch(e){
            traceError(box,"That transaction ID wasn't found on Ethereum. Check for typos, and make sure the chain matches the coin you sent.",'<a href="https://etherscan.io/tx/'+esc(hash)+'" target="_blank" rel="noopener">Try it on Etherscan</a>');
          }
        }

        async function traceTrx(box,hash){
          try{
            var r=await fetch("https://api.trongrid.io/v1/transactions/"+encodeURIComponent(hash));
            if(!r.ok) throw new Error("nf");
            var d=await r.json();
            var tx=(d.data&&d.data[0])||null;
            if(!tx) throw new Error("nf");
            var c=tx.raw_data&&tx.raw_data.contract&&tx.raw_data.contract[0];
            var v=c&&c.parameter&&c.parameter.value;
            var html='<h3 style="margin-bottom:14px">Trace result — Tron</h3>';
            if(v&&v.to_address){
              var amt=v.amount?(" · "+(v.amount/1e6)+" TRX"):"";
              html+=hopHtml(1,"Transfer went to (hex address)",v.to_address,"From "+(v.owner_address||"unknown")+amt);
            }else{
              html+='<p class="tool-note">This is a smart-contract transaction (for example a USDT token transfer). The destination is inside the contract data.</p>';
            }
            html+='<p class="tool-note">Full Tron tracing, including TRC-20 tokens, is done as part of a case review. <a href="#case">Open a case</a> and include this transaction ID. <a href="https://tronscan.org/#/transaction/'+esc(hash)+'" target="_blank" rel="noopener">View on Tronscan</a></p>';
            box.innerHTML=html; box.classList.add("show");
          }catch(e){
            traceError(box,"That transaction ID wasn't found on Tron. Check for typos, and make sure the chain matches the coin you sent.",'<a href="https://tronscan.org/#/transaction/'+esc(hash)+'" target="_blank" rel="noopener">Try it on Tronscan</a>');
          }
        }

        $("trace-form").addEventListener("submit",function(e){
          e.preventDefault();
          var box=$("trace-result"), chain=$("trace-chain").value, hash=$("trace-hash").value.trim();
          var problem=secretProblem(hash);
          if(problem){ traceError(box,"That input was blocked: it looks like a secret, not a transaction ID. A transaction ID is a long code of letters and numbers from your app or exchange — never a recovery phrase or key."); return; }
          if(!/^[0-9a-fA-F]{64}$/.test(hash)&&chain!=="trx"){ traceError(box,"That doesn't look like a transaction ID. It should be a 64-character code (letters a–f and numbers) shown in your wallet app or exchange history next to the transfer."); return; }
          if(chain==="trx"&&!/^[0-9a-fA-F]{64}$/.test(hash)){ traceError(box,"That doesn't look like a Tron transaction ID. It should be a 64-character code from your wallet app or exchange history."); return; }
          var btn=$("trace-btn"); btn.disabled=true; btn.textContent="Tracing…";
          box.innerHTML='<p class="tool-note">Following the public ledger trail…</p>'; box.classList.add("show");
          var done=function(){ btn.disabled=false; btn.textContent="Trace it free"; };
          var p= chain==="btc"?traceBtc(box,hash): chain==="eth"?traceEth(box,hash):traceTrx(box,hash);
          Promise.resolve(p).then(done,done);
        });
      })();

/* ---- Dark-mode toggle ---- */
(function () {
  "use strict";
  var KEY = "chainguard-theme";
  var btn = document.getElementById("theme-toggle");
  if (!btn) return;
  function apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    btn.querySelector(".theme-toggle-label").textContent = theme === "dark" ? "Light" : "Dark";
    btn.querySelector(".theme-toggle-icon").textContent = theme === "dark" ? "\u2600" : "\u263E";
    btn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  }
  var saved = null;
  try { saved = window.localStorage.getItem(KEY); } catch (e) { saved = null; }
  if (saved === "dark" || saved === "light") {
    apply(saved);
  } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    apply("dark");
  } else {
    apply("light");
  }
  btn.addEventListener("click", function () {
    var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    try { window.localStorage.setItem(KEY, next); } catch (e) {}
    apply(next);
  });
})();
