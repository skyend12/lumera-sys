<script>
	import Navbar from './Navbar.svelte';
	import { fade, fly, slide } from 'svelte/transition';
	import { Router, Link, Route } from "svelte-routing";
	import { createEventDispatcher } from 'svelte';

  // inisialisasi navbar
  // navbar dibuat dalam bentuk json untuk mempermudah pengelolaan
  let opened_navbar_item_tree = null;
  let navbar_item = [
    {
      nav_id    : 0,
      nav_body  : "Dashboard",
      nav_icon  : "fa fa-tachometer-alt",
      nav_child : [],
      nav_to    : "dashboard"
    },
    {
      nav_id    : 1,
      nav_body  : "Master Data",
      nav_icon  : "fa fa-database",
      nav_show_child : false,
      nav_child : [
        {
          nav_body : "Staf",
          nav_icon : "fa fa-user",
          nav_to   : "staf"
        },
        {
          nav_body : "Produk Kecantikan",
          nav_icon : "fas fa-spa",
          nav_to   : "produkkecantikan"
        },
        {
          nav_body : "Layanan",
          nav_icon : "fa fa-handshake",
          nav_to   : "layanan"
        },
        {
          nav_body : "Pasien",
          nav_icon : "fa fa-address-book",
          nav_to   : "pasien"
        }
      ]
    },
    {
      nav_id    : 2,
      nav_body  : "Pembelian",
      nav_icon  : "fas fa-cart-plus",
      nav_child : [
        {
          nav_body : "Produk Kecantikan",
          nav_icon : "fas fa-spa",
          nav_to   : "beli-produkkecantikan"
        },
        {
          nav_body : "Inventaris",
          nav_icon : "fa fa-cubes",
          nav_to   : "beli-inventaris"
        },
      ]
    },
    {
      nav_id    : 3,
      nav_body  : "Penjualan",
      nav_icon  : "fas fa-cash-register",
      nav_child : [
        {
          nav_body : "Produk Kecantikan",
          nav_icon : "fas fa-spa",
          nav_to   : "produkkecantikan"
        },
        {
          nav_body : "Klinik",
          nav_icon : "far fa-circle",
          nav_to   : "jasa"
        },
        {
          nav_body : "Salon",
          nav_icon : "far fa-circle",
          nav_to   : "jasa"
        },
      ]
    },
    {
      nav_id    : 4,
      nav_body  : "Laporan",
      nav_icon  : "fas fa-print",
      nav_child : [
        {
          nav_body : "Produk Kecantikan",
          nav_icon : "far fa-circle",
          nav_to   : "produkkecantikan"
        },
        {
          nav_body : "Jasa",
          nav_icon : "far fa-circle",
          nav_to   : "jasa"
        },
      ]
    },
  ]

	const dispatch = createEventDispatcher();

	let container_margin = 0;
	let sidebar_visible = 0;
	let navbar_margin = 250;
	let masterdatachild_visible = false;
	
  // toggle sidebar
	function toggleSidebar(){
		if(sidebar_visible == 0){
      navbar_margin    = 0;
      container_margin = 0;
      dispatch('message', {
          text: container_margin
      });
      setTimeout(() => {
        sidebar_visible  = -250;
      },100);
		}
		else{
			sidebar_visible = 0;
      setTimeout(() => {
        container_margin = 250;
        navbar_margin = 250;
        dispatch('message', {
          text: container_margin
        });
      },100);
		}

	}
	

	function toggleNav(parameter_arr_index){

    if(navbar_item[parameter_arr_index].nav_child.length){
      
      if(navbar_item[parameter_arr_index].nav_show_child == true){
        navbar_item[parameter_arr_index].nav_show_child = false;
        opened_navbar_item_tree = null;
      }
      
      else{
        // untuk menutup navbar tree lain yang sedang terbuka
        if(opened_navbar_item_tree != null){
          navbar_item[opened_navbar_item_tree].nav_show_child = false;
        }
        // menyimpan navbar terakhir yang dibuka
        navbar_item[parameter_arr_index].nav_show_child = true;
        opened_navbar_item_tree = parameter_arr_index;
      }
    }
     
}

</script>

<style type="scss">

.sidebar-anim{
  transition:all 0.6s ease-out;

  .brand-text-1{
    font-size: 14px;
    color: #fff;
  }

  .brand-text-2{
    font-size: 12px;
    color: #fff;
  }
}

.nav-argon-item{
    position: relative; 
    cursor: pointer;
    transition: all 0.1s ease;
    &:hover{
      opacity: 0.6;
    }
}

.user-panel{
  border-radius: 6px;
  background-color: #fff !important;
  color: #0d0d0d;

  .user-authorization-info{
    margin-left: 12px;
  }

  .user-authorization-name{
    font-size: 13px;  
  }
  .user-authorization-status{
    font-size: 16px;
    font-weight: bold;
    margin-top: -3px;
  }

  .nav-icon{
    color: blue;
  }


}

</style>

<!-- Main Sidebar Container -->
<aside class="main-sidebar bg-primary elevation-4 sidebar-anim" style="position: fixed;height: 100vh;transform: translateX({sidebar_visible}px);overflow-y: auto;">
  
  <div class="text-white" style="margin:7px;"> 

    <!-- sidebar header -->
    <a href="#" class="brand-link">
      <div class="row w-100">
        <div class="col-4">
          <img src="./assets/img/logo.png" alt="Lumera Logo" style="width: 80px;height: 80px;">
        </div>
        <div class="col-6 mt-3 ml-2">
          <p class="brand-text-1 mb-1 font-weight-light">LumeraSys</p>
          <p class="brand-text-2 mt-0 font-weight-bold">Versi 1.0 rilis 2020</p>
        </div>
      </div>
    </a>

    <!-- Sidebar -->
    <div class="sidebar">
      <!-- Sidebar user panel (optional) -->
      <div class="user-panel mt-1 ml-0 d-flex elevation-2 pt-3 pl-3 pb-1">
          <!-- user profile image -->
          <a href="javascript:;" class="avatar rounded-circle">
              <img alt="Image placeholder" src="./assets/img/profile_picture/avatar_1.jpg">
          </a>
          <div class="user-authorization-info">
            <p class="user-authorization-name m-0 mb-1">Ko Mi Ran</p>
            <p class="user-authorization-status">Administrator</p>
          </div>
      </div>

      <hr class="mt-3 mb-4" />

      <!-- sidebar menu -->
      <nav class="mt-3 container">
        {#each navbar_item as nav_item}
          <!-- solusi sementara -->
          {#if nav_item.nav_child.length > 0}
            <div class="nav-argon-item mt-2" on:click={()=>toggleNav(nav_item.nav_id)}>
              <div class="row text-white position-relative">
                <i class="nav-icon {nav_item.nav_icon} mt-1 col-1 mr-0"></i>
                <p class="mt-0 col-10">{nav_item.nav_body}</p>
                {#if nav_item.nav_child.length > 0}
                  <i class="fa fa-chevron-left" style="position: absolute;right: 10px;top: 7px;font-size:13px;"></i>
                {/if}
              </div>
            </div> 
            {#if nav_item.nav_show_child == true}
              <div transition:slide="{{ y: 100, duration: 300 }}">
                {#each nav_item.nav_child as nav_child}
                  <Link to="{nav_child.nav_to}">
                    <div class="nav-argon-item row text-white position-relative ml-1" on:click={()=>toggleNav(nav_item.nav_id)}>
                      <i class="nav-icon {nav_child.nav_icon} mt-1 col-1 mr-0"></i>
                      <p class="mt-0 col-10">{nav_child.nav_body}</p>
                    </div> 
                  </Link>             
                {/each}
              </div>
            {/if}
          {/if}

          {#if nav_item.nav_child.length == 0}
            <Link to="{nav_item.nav_to}">
              <div class="nav-argon-item mt-2">
                <div class="row text-white position-relative">
                  <i class="nav-icon {nav_item.nav_icon} mt-1 col-1 mr-0"></i>
                  <p class="mt-0 col-10">{nav_item.nav_body}</p>
                  {#if nav_item.nav_child.length > 0}
                    <i class="fa fa-chevron-left" style="position: absolute;right: 10px;top: 7px;font-size:13px;"></i>
                  {/if}
                </div>
              </div> 
            </Link>
          {/if}
        {/each}
      </nav>
    </div>
  </div>
</aside>

<!-- Navbar -->
  <nav class="main-header navbar navbar-expand" style="margin-left:{navbar_margin}px;transition:all 0.5s linear;padding: 0px 0px 18px 0px ;height:auto;background-color: #fff;">
    <!-- Left navbar links -->
    <ul class="navbar-nav">
      <li class="nav-item" style="cursor: pointer;">
        <a class="nav-link text-primary" on:click={toggleSidebar} role="button"><i class="fas fa-bars"></i></a>
      </li>
    </ul>
    <!-- Right navbar links -->
    <ul class="navbar-nav ml-auto">
      <li class="nav-item">
        <a class="nav-link" data-widget="control-sidebar" data-slide="true" href="#" role="button"><i
            class="fas fa-cogs"></i></a>
      </li>
    </ul>
  </nav>
  <!-- /.navbar -->




