<script>

	// import data
	import {onMount} from 'svelte'
	import Invoice from '../component/invoice.svelte';
	import {fade,fly } from 'svelte/transition';
	import {Link} from 'svelte-routing'
	import {formatRupiah} from '../Functions/CurrencyFormatting.svelte'

	export let id;

	let data_raw  = [];
	let cart      = [];
	let data_bind = [];
	let searchBox = "";
	
	let bill = {
		sub_total : 0,
		taxes : 0,
		total : 0
	}

	let purchaseDetail = {
  		purchase_id : '102',
  		purchase_total : 0,
  		purchase_status : 0,
  		purchase_date : 0,
  		purchase_items : []
  	}

	// settings for pagination
	let num_of_page   = [];
  	let active_now    = 1;
  	let active_first  = 1;
  	let active_last   = 9;
  	let per_page_date = 9;

	// recalculate sub total and total when new or deleted item from cart 
	$: {

		let i;
		bill.sub_total = 0;
		bill.total = 0;
		for(i = 0; i < cart.length; i++){
			bill.sub_total += cart[i].product_price * cart[i].product_qty;
		}
		bill.total = bill.sub_total - bill.taxes;}

	$: {
	    if (searchBox != "" && data_raw != []){

	      // reset page
	      data_bind = [];
	      let i =0;
	      let counter = 0;

	      for(i = 0; i < searchBox.length;i++){
	        for(let j = 0; j < data_raw.length;j++){
	          let confirmed = 0;
	          let name = data_raw[j][1].data;
	          for(let c = 0; c < searchBox.length;c++){
	            if(searchBox[c].toLowerCase() == name[c].toLowerCase()){
	              confirmed = 1;
	            }
	            else{
	              confirmed = 0;
	              break;
	            }
	          }
	          if(confirmed == 1){
	            data_bind[counter] = data_raw[j];
	            counter++;
	          }
	        }
	        counter = 0;
	      }
	    }
	    else if(searchBox == "" && data_raw != []){
	      data_bind = data_raw;
	    }

	    bindPage(data_bind.length);
	
	}

	// on mount
	onMount(async() => {

		if(id != "pembelian-baru"){
			fetch("http://127.0.0.1/lumeraAPI/pos_purchase/getAllproductPurchase.php?purchase_id=" + id, {
			    method : 'GET'
			}).then(res => res.json())
			.then(data => {
				purchaseDetail.purchase_id     = data.purchase_id;
				purchaseDetail.purchase_status = data.purchase_status;
				purchaseDetail.purchase_total  = data.purchase_total;
				purchaseDetail.purchase_date   = data.purchase_date;
				purchaseDetail.purchase_items  = data.cart;
				cart = data.cart;
			})
			.catch(err => {
			           
			})
		}

		else{
			purchaseDetail.purchase_id = generateNewPurchaseId();
		}

		fetch("http://127.0.0.1/lumeraAPI/master_data/getAllProduct.php", {
		    method : 'GET'
		})
		.then(res => res.json())
		.then(data => {
		  	data_raw = data;
		  	data_bind = data;
		  	console.log(data_bind);
		    console.log(data_bind[1][1].data);
		})
		.catch(err => {
		           
		})
	})

	function addToCart(id){

		let i = 0;
		let alreadyOnCart = false;
		for(i; i < cart.length; i++){
			
			// only add the qty, if the same item already listed in cart
			if(cart[i].product_name == data_bind[id][1].data){
				alreadyOnCart = true;
				cart[i].product_qty += 1;
			}
		}

		// add new item to the cart if the same item didn't exist yet
		if(alreadyOnCart == false){
			cart = [...cart, {
				product_id    : data_bind[id][0].data,
				product_name  : data_bind[id][1].data, 
				product_price : data_bind[id][2].data,
				product_qty   : 1
			}];
		}
		
	}

	function itemQuantity(operand, i){
		
		if(operand == "+"){
			cart[i].product_qty++;
		}

		else if(operand == "-"){
			if(cart[i].product_qty > 1){
				cart[i].product_qty--;
			}
			else{
				cart.splice(i, 1)
				cart = cart;
			}
		}
	}

	function bindPage(amount_of_data){
    	let i = 0;
    	num_of_page = [];
	    while(amount_of_data > per_page_date){
	      i = i + 1;
	      num_of_page.push(i);
	      amount_of_data -= per_page_date;
	    }
	    if(amount_of_data <= per_page_date){
	      i = i + 1;
	      num_of_page.push(i);
	    }
	    console.log(num_of_page);
  	}

  	function choosePage(page){
	    if(page == 1){
	      active_first = 1;
	      active_last = per_page_date;
	    }
	    else{
	      active_first = ((page - 1) * per_page_date) + 1;
	      active_last  = page * per_page_date;
	    }
	    active_now = page;
	    console.log(active_first);
	    console.log(active_last);
  	}

  	function generateNewPurchaseId(){
  		var randVal = 101+(Math.random()*(999-101));
  		return "102-" + Date.now() + "" + Math.round(randVal);
  	}

  	function goBack(){
  		window.history.back();
  	}

  	function checkoutToApi(statusChooser){
  		
  		// if status is 0 it means only save
  		// if status is 1 it means checkout
  		let status = 0;
  		if(statusChooser == "checkout"){
  			status = 1;
  		}

  		if(cart.length == 0){
  			alert("Keranjang checkout tidak boleh kosong");
  		}

  		else{
  			let confirm_changes;
  			if(status == 0){
  				confirm_changes = confirm("Anda yakin akan menyimpan pembelian ini?\n* Data masih bisa dirubah");
  			}

  			else{
  				confirm_changes = confirm("Anda yakin akan menyimpan pembelian ini?\n* Dengan melakukan checkout data sudah tidak bisa dirubah lagi");
  			}

			if (confirm_changes == true) {
	  			// fill the object 
	  			purchaseDetail.purchase_total = bill.total
	  			purchaseDetail.purchase_items = cart;
	  			purchaseDetail.purchase_status = status; 
	  			
	  			fetch("http://127.0.0.1/lumeraAPI/pos_purchase/saveProductPurchase.php", {
				  method: "POST",
				  body: JSON.stringify(purchaseDetail),
				  headers: {
				    "Content-Type": "application/x-www-form-urlencoded"
				  }
				}).then(function(response) {
				  response.status     //=> number 100–599
				  response.statusText //=> String
				  response.headers    //=> Headers
				  response.url        //=> String
				  alert("Data berhasil disimpan");
				  goBack();
				  console.log(response)
				}, function(error) {
				  error.message //=> String
				})
			}
  		}

  	}

</script>

<style>

	.container{
		font-family:'Lato';
	}
	
	.cart{
		overflow-y: scroll;
	}

	.product .title, .cart .title{
		font-family:'Lato';
		font-weight: bold;
	}

	.bill_row_3 p{
		font-weight:bold;
	}

	.cart{
		height:320px;
	}

	.cart-item .product-name{
		font-family:'Lato';
		font-size:12pt;
	}

	.cart-item .product-price{
		font-family:'Lato';
		font-size:10pt;
		font-weight: bold;
	}

	.cart-item p{
		margin:0;
	}

	.cart-item-quantity-container{
		height:24px;
	}

	.cart-item-quantity-container p{
		font-size:10pt;
	}
	
	.cart-item-quantity-container i{
		height:24px;
		font-size:6pt;
		border-radius:5px;
		cursor: pointer;
	}


	input::-webkit-outer-spin-button,
	input::-webkit-inner-spin-button {
	  -webkit-appearance: none;
	  margin: 0;
	}

</style>

<div class="container" style="margin-bottom:-150px;margin-top:20px;">
	<span class="badge badge-pill badge-primary">ID PEMBELIAN #{purchaseDetail.purchase_id}</span>
	{#if id == "pembelian-baru"}
		<span class="badge badge-pill badge-success">PEMBELIAN BARU</span>
		<div class="row">
				<div class="col-lg-8">
					<div class="product mt-1" style="height:640px;">
						<div class="row">
							<div class="col-lg-8 mb-3">
								<h5 class="title mb-1 mt-1">Daftar Pembelian Produk</h5>
								<p>Lakukan pembelian produk disini</p>
							</div>
							<div class="col-lg-4">
								<div class="input-group mt-2">
			                      <input class="form-control" bind:value="{searchBox}" placeholder="Cari disini.." type="text">
			                      <div class="input-group-append">
			                        <span class="input-group-text"><i style="cursor: pointer;" class="fa fa-search"></i></span>
			                      </div>
			                    </div>
							</div>
							{#each data_bind as product, i}
								{#if i >= active_first - 1 && i < active_last && product[4].data == 1}
									<div class="col-lg-4"> 
										<div class="card p-3">
											<p class="mb-1" style="font-size:1.0rem">{product[1].data}</p>
											<p class="mb-2" style="font-weight: bold;font-size:0.8rem">{formatRupiah(product[2].data, "Rp. ")}/pcs</p>
											<button class="btn btn-success btn-sm" on:click={()=>addToCart(i)}><i class="fa fa-plus p-2 bg-success "></i>TAMBAHKAN</button>
										</div>
									</div>
								{/if}
							{/each}
						</div>
						<nav style="margin-top: 12px;position:absolute;left:20px;bottom:10px">
					      	<ul class="pagination pagination-lg">
					        	{#each num_of_page as page}
					          		<li on:click="{choosePage(page)}" class="page-item"  class:active="{active_now === page}" ><a class="page-link">{page}</a></li>
					        	{/each}
					      	</ul>
					    </nav>
					</div>
				</div>

			<!-- cart, bill -->
			<div class="col-lg-4">

			<!-- cart -->
			<div class="cart card p-3">
				<h5 class="title mb-3">Checkout</h5>
				{#if cart.length > 0}
					{#each cart as cart_item, i}
						
							<div transition:fly="{{ y: -200, duration: 650 }}" class="card p-2 cart-item mb-2">
								<p class="m-0 ml-2 product-name">{cart_item.product_name}</p>
								<div class="cart-item-quantity-container ml-2 mt-1 mb-1 flex">
									<i class="fa fa-plus p-2 bg-success mr-2" on:click={()=>itemQuantity("+", i)}></i>
									<input class="form-control pl-0 pr-0" style="width: 42px;height: 26px;font-size: 0.7rem;text-align: center;" min=1 max=999  type="number" oninput="validity.valid||(value=1);" bind:value="{cart_item.product_qty}" />
									<i class="fa fa-minus p-2 bg-danger ml-2" on:click={()=>itemQuantity("-", i)}></i>
									<p class="m-0 ml-2 product-price">@{formatRupiah(cart_item.product_price * cart_item.product_qty, "Rp. ")}</p>
								</div>
							</div>
					{/each}
				{:else if cart.length == 0}
					<p>Belum ada produk yang dipilih</p>
				{/if}
			</div>
			
			<!-- bill -->
			<div class="card p-3">
				<div class="row bill_row_1">
					<div class="col"><p>Subtotal</p></div>
					<div class="col"><p style="text-align:right">{formatRupiah(bill.sub_total, "Rp. ")}</p></div>
				</div>
				<div class="row bill_row_2">
					<div class="col"><p>Pajak</p></div>
					<div class="col"><p style="text-align:right">{formatRupiah(bill.taxes, "Rp. ")}</p></div>
				</div>
				<div class="row bill_row_3">
					<div class="col"><p>Total</p></div>
					<div class="col"><p style="text-align:right;">{formatRupiah(bill.total, "Rp. ")}</p></div>
				</div>
				<hr class="mt-0 mb-3"/>
				<div class="row ml-2 mr-2">
					<button on:click={() => checkoutToApi("checkout")} class="col-lg-12 btn btn-primary">Checkout</button>	
					<button on:click={() => checkoutToApi("save")} class="col-lg-12 btn btn-outline-success mt-2">Simpan</button>
					<button on:click={() => goBack()} class="col-lg-12 btn btn-outline-danger mt-2">Batal</button>
				</div>
			</div>
			</div></div>
	{:else if id != "pembelian-baru"}
		{#if purchaseDetail.purchase_status == 0}
			<span class="badge badge-pill badge-danger">BELUM CHECKOUT</span>
			<div class="row">
				<div class="col-lg-8">
					<div class="product mt-1" style="height:640px;">
						<div class="row">
							<div class="col-lg-8 mb-3">
								<h5 class="title mb-1 mt-1">Daftar Pembelian Produk</h5>
								<p>Lakukan pembelian produk disini</p>
							</div>
							<div class="col-lg-4">
								<div class="input-group mt-2">
			                      <input class="form-control" bind:value="{searchBox}" placeholder="Cari disini.." type="text">
			                      <div class="input-group-append">
			                        <span class="input-group-text"><i style="cursor: pointer;" class="fa fa-search"></i></span>
			                      </div>
			                    </div>
							</div>
							{#each data_bind as product, i}
								{#if i >= active_first - 1 && i < active_last && product[4].data == 1}
									<div class="col-lg-4"> 
										<div class="card p-3">
											<p class="mb-1" style="font-size:1.0rem">{product[1].data}</p>
											<p class="mb-2" style="font-weight: bold;font-size:0.8rem">{formatRupiah(product[2].data, "Rp. ")}/pcs</p>
											<button class="btn btn-success btn-sm" on:click={()=>addToCart(i)}><i class="fa fa-plus p-2 bg-success "></i>TAMBAHKAN</button>
										</div>
									</div>
								{/if}
							{/each}
						</div>
						<nav style="margin-top: 12px;position:absolute;left:20px;bottom:10px">
					      	<ul class="pagination pagination-lg">
					        	{#each num_of_page as page}
					          		<li on:click="{choosePage(page)}" class="page-item"  class:active="{active_now === page}" ><a class="page-link">{page}</a></li>
					        	{/each}
					      	</ul>
					    </nav>
					</div>
				</div>

			<!-- cart, bill -->
			<div class="col-lg-4">

			<!-- cart -->
			<div class="cart card p-3">
				<h5 class="title mb-3">Checkout</h5>
				{#if cart.length > 0}
					{#each cart as cart_item, i}
						<div transition:fly="{{ y: -200, duration: 650 }}" class="card p-2 cart-item mb-2">
							<p class="m-0 ml-2 product-name">{cart_item.product_name}</p>
							<div class="cart-item-quantity-container ml-2 mt-1 mb-1 flex">
								<i class="fa fa-plus p-2 bg-success mr-2" on:click={()=>itemQuantity("+", i)}></i>
								<input class="form-control pl-0 pr-0" style="width: 42px;height: 26px;font-size: 0.7rem;text-align: center;" min=1 max=999  type="number" oninput="validity.valid||(value=1);" bind:value="{cart_item.product_qty}" />
								<i class="fa fa-minus p-2 bg-danger ml-2" on:click={()=>itemQuantity("-", i)}></i>
								<p class="m-0 ml-2 product-price">@{formatRupiah(cart_item.product_price * cart_item.product_qty, "Rp. ")}</p>
							</div>
						</div>
					{/each}
				{:else if cart.length == 0}
					<p>Belum ada produk yang dipilih</p>
				{/if}
			</div>
			
			<!-- bill -->
			<div class="card p-3">
				<div class="row bill_row_1">
					<div class="col"><p>Subtotal</p></div>
					<div class="col"><p style="text-align:right">{formatRupiah(bill.sub_total, "Rp. ")}</p></div>
				</div>
				<div class="row bill_row_2">
					<div class="col"><p>Pajak</p></div>
					<div class="col"><p style="text-align:right">{formatRupiah(bill.taxes, "Rp. ")}</p></div>
				</div>
				<div class="row bill_row_3">
					<div class="col"><p>Total</p></div>
					<div class="col"><p style="text-align:right;">{formatRupiah(bill.total, "Rp. ")}</p></div>
				</div>
				<hr class="mt-0 mb-3"/>
				<div class="row ml-2 mr-2">
					<button on:click={() => checkoutToApi("checkout")} class="col-lg-12 btn btn-primary">Checkout</button>	
					<button on:click={() => checkoutToApi("save")} class="col-lg-12 btn btn-outline-success mt-2">Simpan</button>
					<button on:click={() => goBack()} class="col-lg-12 btn btn-outline-danger mt-2">Batal</button>
				</div>
			</div>
			</div></div>
		{:else if purchaseDetail.purchase_status == 1}
			<Invoice invoice_data={purchaseDetail} />
		{/if}
	{/if}

</div>