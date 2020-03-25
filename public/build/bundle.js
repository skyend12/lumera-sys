
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value' || descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let stylesheet;
    let active = 0;
    let current_rules = {};
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        if (!current_rules[name]) {
            if (!stylesheet) {
                const style = element('style');
                document.head.appendChild(style);
                stylesheet = style.sheet;
            }
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        node.style.animation = (node.style.animation || '')
            .split(', ')
            .filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        )
            .join(', ');
        if (name && !--active)
            clear_rules();
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            let i = stylesheet.cssRules.length;
            while (i--)
                stylesheet.deleteRule(i);
            current_rules = {};
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.19.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\layout\Navbar.svelte generated by Svelte v3.19.2 */

    const file = "src\\layout\\Navbar.svelte";

    function create_fragment(ctx) {
    	let nav;
    	let ul0;
    	let li0;
    	let a0;
    	let i0;
    	let t;
    	let ul1;
    	let li1;
    	let a1;
    	let i1;

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			ul0 = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			i0 = element("i");
    			t = space();
    			ul1 = element("ul");
    			li1 = element("li");
    			a1 = element("a");
    			i1 = element("i");
    			attr_dev(i0, "class", "fas fa-bars");
    			add_location(i0, file, 13, 74, 293);
    			attr_dev(a0, "class", "nav-link");
    			attr_dev(a0, "data-widget", "pushmenu");
    			attr_dev(a0, "href", "#");
    			attr_dev(a0, "role", "button");
    			add_location(a0, file, 13, 8, 227);
    			attr_dev(li0, "class", "nav-item");
    			add_location(li0, file, 12, 6, 196);
    			attr_dev(ul0, "class", "navbar-nav");
    			add_location(ul0, file, 11, 4, 165);
    			attr_dev(i1, "class", "fas fa-cogs");
    			add_location(i1, file, 19, 99, 548);
    			attr_dev(a1, "class", "nav-link");
    			attr_dev(a1, "data-widget", "control-sidebar");
    			attr_dev(a1, "data-slide", "true");
    			attr_dev(a1, "href", "#");
    			attr_dev(a1, "role", "button");
    			add_location(a1, file, 19, 8, 457);
    			attr_dev(li1, "class", "nav-item");
    			add_location(li1, file, 18, 6, 426);
    			attr_dev(ul1, "class", "navbar-nav ml-auto");
    			add_location(ul1, file, 17, 4, 387);
    			attr_dev(nav, "class", "main-header navbar navbar-expand navbar-dark");
    			add_location(nav, file, 9, 2, 69);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, ul0);
    			append_dev(ul0, li0);
    			append_dev(li0, a0);
    			append_dev(a0, i0);
    			append_dev(nav, t);
    			append_dev(nav, ul1);
    			append_dev(ul1, li1);
    			append_dev(li1, a1);
    			append_dev(a1, i1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Navbar> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Navbar", $$slots, []);
    	return [];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }
    function slide(node, { delay = 0, duration = 400, easing = cubicOut }) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const height = parseFloat(style.height);
        const padding_top = parseFloat(style.paddingTop);
        const padding_bottom = parseFloat(style.paddingBottom);
        const margin_top = parseFloat(style.marginTop);
        const margin_bottom = parseFloat(style.marginBottom);
        const border_top_width = parseFloat(style.borderTopWidth);
        const border_bottom_width = parseFloat(style.borderBottomWidth);
        return {
            delay,
            duration,
            easing,
            css: t => `overflow: hidden;` +
                `opacity: ${Math.min(t * 20, 1) * opacity};` +
                `height: ${t * height}px;` +
                `padding-top: ${t * padding_top}px;` +
                `padding-bottom: ${t * padding_bottom}px;` +
                `margin-top: ${t * margin_top}px;` +
                `margin-bottom: ${t * margin_bottom}px;` +
                `border-top-width: ${t * border_top_width}px;` +
                `border-bottom-width: ${t * border_bottom_width}px;`
        };
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    const LOCATION = {};
    const ROUTER = {};

    /**
     * Adapted from https://github.com/reach/router/blob/b60e6dd781d5d3a4bdaaf4de665649c0f6a7e78d/src/lib/history.js
     *
     * https://github.com/reach/router/blob/master/LICENSE
     * */

    function getLocation(source) {
      return {
        ...source.location,
        state: source.history.state,
        key: (source.history.state && source.history.state.key) || "initial"
      };
    }

    function createHistory(source, options) {
      const listeners = [];
      let location = getLocation(source);

      return {
        get location() {
          return location;
        },

        listen(listener) {
          listeners.push(listener);

          const popstateListener = () => {
            location = getLocation(source);
            listener({ location, action: "POP" });
          };

          source.addEventListener("popstate", popstateListener);

          return () => {
            source.removeEventListener("popstate", popstateListener);

            const index = listeners.indexOf(listener);
            listeners.splice(index, 1);
          };
        },

        navigate(to, { state, replace = false } = {}) {
          state = { ...state, key: Date.now() + "" };
          // try...catch iOS Safari limits to 100 pushState calls
          try {
            if (replace) {
              source.history.replaceState(state, null, to);
            } else {
              source.history.pushState(state, null, to);
            }
          } catch (e) {
            source.location[replace ? "replace" : "assign"](to);
          }

          location = getLocation(source);
          listeners.forEach(listener => listener({ location, action: "PUSH" }));
        }
      };
    }

    // Stores history entries in memory for testing or other platforms like Native
    function createMemorySource(initialPathname = "/") {
      let index = 0;
      const stack = [{ pathname: initialPathname, search: "" }];
      const states = [];

      return {
        get location() {
          return stack[index];
        },
        addEventListener(name, fn) {},
        removeEventListener(name, fn) {},
        history: {
          get entries() {
            return stack;
          },
          get index() {
            return index;
          },
          get state() {
            return states[index];
          },
          pushState(state, _, uri) {
            const [pathname, search = ""] = uri.split("?");
            index++;
            stack.push({ pathname, search });
            states.push(state);
          },
          replaceState(state, _, uri) {
            const [pathname, search = ""] = uri.split("?");
            stack[index] = { pathname, search };
            states[index] = state;
          }
        }
      };
    }

    // Global history uses window.history as the source if available,
    // otherwise a memory history
    const canUseDOM = Boolean(
      typeof window !== "undefined" &&
        window.document &&
        window.document.createElement
    );
    const globalHistory = createHistory(canUseDOM ? window : createMemorySource());
    const { navigate } = globalHistory;

    /**
     * Adapted from https://github.com/reach/router/blob/b60e6dd781d5d3a4bdaaf4de665649c0f6a7e78d/src/lib/utils.js
     *
     * https://github.com/reach/router/blob/master/LICENSE
     * */

    const paramRe = /^:(.+)/;

    const SEGMENT_POINTS = 4;
    const STATIC_POINTS = 3;
    const DYNAMIC_POINTS = 2;
    const SPLAT_PENALTY = 1;
    const ROOT_POINTS = 1;

    /**
     * Check if `string` starts with `search`
     * @param {string} string
     * @param {string} search
     * @return {boolean}
     */
    function startsWith(string, search) {
      return string.substr(0, search.length) === search;
    }

    /**
     * Check if `segment` is a root segment
     * @param {string} segment
     * @return {boolean}
     */
    function isRootSegment(segment) {
      return segment === "";
    }

    /**
     * Check if `segment` is a dynamic segment
     * @param {string} segment
     * @return {boolean}
     */
    function isDynamic(segment) {
      return paramRe.test(segment);
    }

    /**
     * Check if `segment` is a splat
     * @param {string} segment
     * @return {boolean}
     */
    function isSplat(segment) {
      return segment[0] === "*";
    }

    /**
     * Split up the URI into segments delimited by `/`
     * @param {string} uri
     * @return {string[]}
     */
    function segmentize(uri) {
      return (
        uri
          // Strip starting/ending `/`
          .replace(/(^\/+|\/+$)/g, "")
          .split("/")
      );
    }

    /**
     * Strip `str` of potential start and end `/`
     * @param {string} str
     * @return {string}
     */
    function stripSlashes(str) {
      return str.replace(/(^\/+|\/+$)/g, "");
    }

    /**
     * Score a route depending on how its individual segments look
     * @param {object} route
     * @param {number} index
     * @return {object}
     */
    function rankRoute(route, index) {
      const score = route.default
        ? 0
        : segmentize(route.path).reduce((score, segment) => {
            score += SEGMENT_POINTS;

            if (isRootSegment(segment)) {
              score += ROOT_POINTS;
            } else if (isDynamic(segment)) {
              score += DYNAMIC_POINTS;
            } else if (isSplat(segment)) {
              score -= SEGMENT_POINTS + SPLAT_PENALTY;
            } else {
              score += STATIC_POINTS;
            }

            return score;
          }, 0);

      return { route, score, index };
    }

    /**
     * Give a score to all routes and sort them on that
     * @param {object[]} routes
     * @return {object[]}
     */
    function rankRoutes(routes) {
      return (
        routes
          .map(rankRoute)
          // If two routes have the exact same score, we go by index instead
          .sort((a, b) =>
            a.score < b.score ? 1 : a.score > b.score ? -1 : a.index - b.index
          )
      );
    }

    /**
     * Ranks and picks the best route to match. Each segment gets the highest
     * amount of points, then the type of segment gets an additional amount of
     * points where
     *
     *  static > dynamic > splat > root
     *
     * This way we don't have to worry about the order of our routes, let the
     * computers do it.
     *
     * A route looks like this
     *
     *  { path, default, value }
     *
     * And a returned match looks like:
     *
     *  { route, params, uri }
     *
     * @param {object[]} routes
     * @param {string} uri
     * @return {?object}
     */
    function pick(routes, uri) {
      let match;
      let default_;

      const [uriPathname] = uri.split("?");
      const uriSegments = segmentize(uriPathname);
      const isRootUri = uriSegments[0] === "";
      const ranked = rankRoutes(routes);

      for (let i = 0, l = ranked.length; i < l; i++) {
        const route = ranked[i].route;
        let missed = false;

        if (route.default) {
          default_ = {
            route,
            params: {},
            uri
          };
          continue;
        }

        const routeSegments = segmentize(route.path);
        const params = {};
        const max = Math.max(uriSegments.length, routeSegments.length);
        let index = 0;

        for (; index < max; index++) {
          const routeSegment = routeSegments[index];
          const uriSegment = uriSegments[index];

          if (routeSegment !== undefined && isSplat(routeSegment)) {
            // Hit a splat, just grab the rest, and return a match
            // uri:   /files/documents/work
            // route: /files/* or /files/*splatname
            const splatName = routeSegment === "*" ? "*" : routeSegment.slice(1);

            params[splatName] = uriSegments
              .slice(index)
              .map(decodeURIComponent)
              .join("/");
            break;
          }

          if (uriSegment === undefined) {
            // URI is shorter than the route, no match
            // uri:   /users
            // route: /users/:userId
            missed = true;
            break;
          }

          let dynamicMatch = paramRe.exec(routeSegment);

          if (dynamicMatch && !isRootUri) {
            const value = decodeURIComponent(uriSegment);
            params[dynamicMatch[1]] = value;
          } else if (routeSegment !== uriSegment) {
            // Current segments don't match, not dynamic, not splat, so no match
            // uri:   /users/123/settings
            // route: /users/:id/profile
            missed = true;
            break;
          }
        }

        if (!missed) {
          match = {
            route,
            params,
            uri: "/" + uriSegments.slice(0, index).join("/")
          };
          break;
        }
      }

      return match || default_ || null;
    }

    /**
     * Check if the `path` matches the `uri`.
     * @param {string} path
     * @param {string} uri
     * @return {?object}
     */
    function match(route, uri) {
      return pick([route], uri);
    }

    /**
     * Add the query to the pathname if a query is given
     * @param {string} pathname
     * @param {string} [query]
     * @return {string}
     */
    function addQuery(pathname, query) {
      return pathname + (query ? `?${query}` : "");
    }

    /**
     * Resolve URIs as though every path is a directory, no files. Relative URIs
     * in the browser can feel awkward because not only can you be "in a directory",
     * you can be "at a file", too. For example:
     *
     *  browserSpecResolve('foo', '/bar/') => /bar/foo
     *  browserSpecResolve('foo', '/bar') => /foo
     *
     * But on the command line of a file system, it's not as complicated. You can't
     * `cd` from a file, only directories. This way, links have to know less about
     * their current path. To go deeper you can do this:
     *
     *  <Link to="deeper"/>
     *  // instead of
     *  <Link to=`{${props.uri}/deeper}`/>
     *
     * Just like `cd`, if you want to go deeper from the command line, you do this:
     *
     *  cd deeper
     *  # not
     *  cd $(pwd)/deeper
     *
     * By treating every path as a directory, linking to relative paths should
     * require less contextual information and (fingers crossed) be more intuitive.
     * @param {string} to
     * @param {string} base
     * @return {string}
     */
    function resolve(to, base) {
      // /foo/bar, /baz/qux => /foo/bar
      if (startsWith(to, "/")) {
        return to;
      }

      const [toPathname, toQuery] = to.split("?");
      const [basePathname] = base.split("?");
      const toSegments = segmentize(toPathname);
      const baseSegments = segmentize(basePathname);

      // ?a=b, /users?b=c => /users?a=b
      if (toSegments[0] === "") {
        return addQuery(basePathname, toQuery);
      }

      // profile, /users/789 => /users/789/profile
      if (!startsWith(toSegments[0], ".")) {
        const pathname = baseSegments.concat(toSegments).join("/");

        return addQuery((basePathname === "/" ? "" : "/") + pathname, toQuery);
      }

      // ./       , /users/123 => /users/123
      // ../      , /users/123 => /users
      // ../..    , /users/123 => /
      // ../../one, /a/b/c/d   => /a/b/one
      // .././one , /a/b/c/d   => /a/b/c/one
      const allSegments = baseSegments.concat(toSegments);
      const segments = [];

      allSegments.forEach(segment => {
        if (segment === "..") {
          segments.pop();
        } else if (segment !== ".") {
          segments.push(segment);
        }
      });

      return addQuery("/" + segments.join("/"), toQuery);
    }

    /**
     * Combines the `basepath` and the `path` into one path.
     * @param {string} basepath
     * @param {string} path
     */
    function combinePaths(basepath, path) {
      return `${stripSlashes(
    path === "/" ? basepath : `${stripSlashes(basepath)}/${stripSlashes(path)}`
  )}/`;
    }

    /**
     * Decides whether a given `event` should result in a navigation or not.
     * @param {object} event
     */
    function shouldNavigate(event) {
      return (
        !event.defaultPrevented &&
        event.button === 0 &&
        !(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
      );
    }

    /* node_modules\svelte-routing\src\Router.svelte generated by Svelte v3.19.2 */

    function create_fragment$1(ctx) {
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[16].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[15], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 32768) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[15], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[15], dirty, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $base;
    	let $location;
    	let $routes;
    	let { basepath = "/" } = $$props;
    	let { url = null } = $$props;
    	const locationContext = getContext(LOCATION);
    	const routerContext = getContext(ROUTER);
    	const routes = writable([]);
    	validate_store(routes, "routes");
    	component_subscribe($$self, routes, value => $$invalidate(8, $routes = value));
    	const activeRoute = writable(null);
    	let hasActiveRoute = false; // Used in SSR to synchronously set that a Route is active.

    	// If locationContext is not set, this is the topmost Router in the tree.
    	// If the `url` prop is given we force the location to it.
    	const location = locationContext || writable(url ? { pathname: url } : globalHistory.location);

    	validate_store(location, "location");
    	component_subscribe($$self, location, value => $$invalidate(7, $location = value));

    	// If routerContext is set, the routerBase of the parent Router
    	// will be the base for this Router's descendants.
    	// If routerContext is not set, the path and resolved uri will both
    	// have the value of the basepath prop.
    	const base = routerContext
    	? routerContext.routerBase
    	: writable({ path: basepath, uri: basepath });

    	validate_store(base, "base");
    	component_subscribe($$self, base, value => $$invalidate(6, $base = value));

    	const routerBase = derived([base, activeRoute], ([base, activeRoute]) => {
    		// If there is no activeRoute, the routerBase will be identical to the base.
    		if (activeRoute === null) {
    			return base;
    		}

    		const { path: basepath } = base;
    		const { route, uri } = activeRoute;

    		// Remove the potential /* or /*splatname from
    		// the end of the child Routes relative paths.
    		const path = route.default
    		? basepath
    		: route.path.replace(/\*.*$/, "");

    		return { path, uri };
    	});

    	function registerRoute(route) {
    		const { path: basepath } = $base;
    		let { path } = route;

    		// We store the original path in the _path property so we can reuse
    		// it when the basepath changes. The only thing that matters is that
    		// the route reference is intact, so mutation is fine.
    		route._path = path;

    		route.path = combinePaths(basepath, path);

    		if (typeof window === "undefined") {
    			// In SSR we should set the activeRoute immediately if it is a match.
    			// If there are more Routes being registered after a match is found,
    			// we just skip them.
    			if (hasActiveRoute) {
    				return;
    			}

    			const matchingRoute = match(route, $location.pathname);

    			if (matchingRoute) {
    				activeRoute.set(matchingRoute);
    				hasActiveRoute = true;
    			}
    		} else {
    			routes.update(rs => {
    				rs.push(route);
    				return rs;
    			});
    		}
    	}

    	function unregisterRoute(route) {
    		routes.update(rs => {
    			const index = rs.indexOf(route);
    			rs.splice(index, 1);
    			return rs;
    		});
    	}

    	if (!locationContext) {
    		// The topmost Router in the tree is responsible for updating
    		// the location store and supplying it through context.
    		onMount(() => {
    			const unlisten = globalHistory.listen(history => {
    				location.set(history.location);
    			});

    			return unlisten;
    		});

    		setContext(LOCATION, location);
    	}

    	setContext(ROUTER, {
    		activeRoute,
    		base,
    		routerBase,
    		registerRoute,
    		unregisterRoute
    	});

    	const writable_props = ["basepath", "url"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Router", $$slots, ['default']);

    	$$self.$set = $$props => {
    		if ("basepath" in $$props) $$invalidate(3, basepath = $$props.basepath);
    		if ("url" in $$props) $$invalidate(4, url = $$props.url);
    		if ("$$scope" in $$props) $$invalidate(15, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		setContext,
    		onMount,
    		writable,
    		derived,
    		LOCATION,
    		ROUTER,
    		globalHistory,
    		pick,
    		match,
    		stripSlashes,
    		combinePaths,
    		basepath,
    		url,
    		locationContext,
    		routerContext,
    		routes,
    		activeRoute,
    		hasActiveRoute,
    		location,
    		base,
    		routerBase,
    		registerRoute,
    		unregisterRoute,
    		$base,
    		$location,
    		$routes
    	});

    	$$self.$inject_state = $$props => {
    		if ("basepath" in $$props) $$invalidate(3, basepath = $$props.basepath);
    		if ("url" in $$props) $$invalidate(4, url = $$props.url);
    		if ("hasActiveRoute" in $$props) hasActiveRoute = $$props.hasActiveRoute;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$base*/ 64) {
    			// This reactive statement will update all the Routes' path when
    			// the basepath changes.
    			 {
    				const { path: basepath } = $base;

    				routes.update(rs => {
    					rs.forEach(r => r.path = combinePaths(basepath, r._path));
    					return rs;
    				});
    			}
    		}

    		if ($$self.$$.dirty & /*$routes, $location*/ 384) {
    			// This reactive statement will be run when the Router is created
    			// when there are no Routes and then again the following tick, so it
    			// will not find an active Route in SSR and in the browser it will only
    			// pick an active Route after all Routes have been registered.
    			 {
    				const bestMatch = pick($routes, $location.pathname);
    				activeRoute.set(bestMatch);
    			}
    		}
    	};

    	return [
    		routes,
    		location,
    		base,
    		basepath,
    		url,
    		hasActiveRoute,
    		$base,
    		$location,
    		$routes,
    		locationContext,
    		routerContext,
    		activeRoute,
    		routerBase,
    		registerRoute,
    		unregisterRoute,
    		$$scope,
    		$$slots
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { basepath: 3, url: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get basepath() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set basepath(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get url() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set url(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-routing\src\Route.svelte generated by Svelte v3.19.2 */

    const get_default_slot_changes = dirty => ({
    	params: dirty & /*routeParams*/ 2,
    	location: dirty & /*$location*/ 16
    });

    const get_default_slot_context = ctx => ({
    	params: /*routeParams*/ ctx[1],
    	location: /*$location*/ ctx[4]
    });

    // (40:0) {#if $activeRoute !== null && $activeRoute.route === route}
    function create_if_block(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*component*/ ctx[0] !== null) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(40:0) {#if $activeRoute !== null && $activeRoute.route === route}",
    		ctx
    	});

    	return block;
    }

    // (43:2) {:else}
    function create_else_block(ctx) {
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[13].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[12], get_default_slot_context);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot && default_slot.p && dirty & /*$$scope, routeParams, $location*/ 4114) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[12], get_default_slot_context), get_slot_changes(default_slot_template, /*$$scope*/ ctx[12], dirty, get_default_slot_changes));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(43:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (41:2) {#if component !== null}
    function create_if_block_1(ctx) {
    	let switch_instance_anchor;
    	let current;

    	const switch_instance_spread_levels = [
    		{ location: /*$location*/ ctx[4] },
    		/*routeParams*/ ctx[1],
    		/*routeProps*/ ctx[2]
    	];

    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*$location, routeParams, routeProps*/ 22)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*$location*/ 16 && { location: /*$location*/ ctx[4] },
    					dirty & /*routeParams*/ 2 && get_spread_object(/*routeParams*/ ctx[1]),
    					dirty & /*routeProps*/ 4 && get_spread_object(/*routeProps*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(41:2) {#if component !== null}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$activeRoute*/ ctx[3] !== null && /*$activeRoute*/ ctx[3].route === /*route*/ ctx[7] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$activeRoute*/ ctx[3] !== null && /*$activeRoute*/ ctx[3].route === /*route*/ ctx[7]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $activeRoute;
    	let $location;
    	let { path = "" } = $$props;
    	let { component = null } = $$props;
    	const { registerRoute, unregisterRoute, activeRoute } = getContext(ROUTER);
    	validate_store(activeRoute, "activeRoute");
    	component_subscribe($$self, activeRoute, value => $$invalidate(3, $activeRoute = value));
    	const location = getContext(LOCATION);
    	validate_store(location, "location");
    	component_subscribe($$self, location, value => $$invalidate(4, $location = value));

    	const route = {
    		path,
    		// If no path prop is given, this Route will act as the default Route
    		// that is rendered if no other Route in the Router is a match.
    		default: path === ""
    	};

    	let routeParams = {};
    	let routeProps = {};
    	registerRoute(route);

    	// There is no need to unregister Routes in SSR since it will all be
    	// thrown away anyway.
    	if (typeof window !== "undefined") {
    		onDestroy(() => {
    			unregisterRoute(route);
    		});
    	}

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Route", $$slots, ['default']);

    	$$self.$set = $$new_props => {
    		$$invalidate(11, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("path" in $$new_props) $$invalidate(8, path = $$new_props.path);
    		if ("component" in $$new_props) $$invalidate(0, component = $$new_props.component);
    		if ("$$scope" in $$new_props) $$invalidate(12, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		onDestroy,
    		ROUTER,
    		LOCATION,
    		path,
    		component,
    		registerRoute,
    		unregisterRoute,
    		activeRoute,
    		location,
    		route,
    		routeParams,
    		routeProps,
    		$activeRoute,
    		$location
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(11, $$props = assign(assign({}, $$props), $$new_props));
    		if ("path" in $$props) $$invalidate(8, path = $$new_props.path);
    		if ("component" in $$props) $$invalidate(0, component = $$new_props.component);
    		if ("routeParams" in $$props) $$invalidate(1, routeParams = $$new_props.routeParams);
    		if ("routeProps" in $$props) $$invalidate(2, routeProps = $$new_props.routeProps);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$activeRoute*/ 8) {
    			 if ($activeRoute && $activeRoute.route === route) {
    				$$invalidate(1, routeParams = $activeRoute.params);
    			}
    		}

    		 {
    			const { path, component, ...rest } = $$props;
    			$$invalidate(2, routeProps = rest);
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		component,
    		routeParams,
    		routeProps,
    		$activeRoute,
    		$location,
    		activeRoute,
    		location,
    		route,
    		path,
    		registerRoute,
    		unregisterRoute,
    		$$props,
    		$$scope,
    		$$slots
    	];
    }

    class Route extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { path: 8, component: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Route",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get path() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set path(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get component() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set component(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-routing\src\Link.svelte generated by Svelte v3.19.2 */
    const file$1 = "node_modules\\svelte-routing\\src\\Link.svelte";

    function create_fragment$3(ctx) {
    	let a;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[16].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[15], null);

    	let a_levels = [
    		{ href: /*href*/ ctx[0] },
    		{ "aria-current": /*ariaCurrent*/ ctx[2] },
    		/*props*/ ctx[1]
    	];

    	let a_data = {};

    	for (let i = 0; i < a_levels.length; i += 1) {
    		a_data = assign(a_data, a_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			a = element("a");
    			if (default_slot) default_slot.c();
    			set_attributes(a, a_data);
    			add_location(a, file$1, 40, 0, 1249);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (default_slot) {
    				default_slot.m(a, null);
    			}

    			current = true;
    			dispose = listen_dev(a, "click", /*onClick*/ ctx[5], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 32768) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[15], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[15], dirty, null));
    			}

    			set_attributes(a, get_spread_update(a_levels, [
    				dirty & /*href*/ 1 && { href: /*href*/ ctx[0] },
    				dirty & /*ariaCurrent*/ 4 && { "aria-current": /*ariaCurrent*/ ctx[2] },
    				dirty & /*props*/ 2 && /*props*/ ctx[1]
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (default_slot) default_slot.d(detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $base;
    	let $location;
    	let { to = "#" } = $$props;
    	let { replace = false } = $$props;
    	let { state = {} } = $$props;
    	let { getProps = () => ({}) } = $$props;
    	const { base } = getContext(ROUTER);
    	validate_store(base, "base");
    	component_subscribe($$self, base, value => $$invalidate(12, $base = value));
    	const location = getContext(LOCATION);
    	validate_store(location, "location");
    	component_subscribe($$self, location, value => $$invalidate(13, $location = value));
    	const dispatch = createEventDispatcher();
    	let href, isPartiallyCurrent, isCurrent, props;

    	function onClick(event) {
    		dispatch("click", event);

    		if (shouldNavigate(event)) {
    			event.preventDefault();

    			// Don't push another entry to the history stack when the user
    			// clicks on a Link to the page they are currently on.
    			const shouldReplace = $location.pathname === href || replace;

    			navigate(href, { state, replace: shouldReplace });
    		}
    	}

    	const writable_props = ["to", "replace", "state", "getProps"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Link> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Link", $$slots, ['default']);

    	$$self.$set = $$props => {
    		if ("to" in $$props) $$invalidate(6, to = $$props.to);
    		if ("replace" in $$props) $$invalidate(7, replace = $$props.replace);
    		if ("state" in $$props) $$invalidate(8, state = $$props.state);
    		if ("getProps" in $$props) $$invalidate(9, getProps = $$props.getProps);
    		if ("$$scope" in $$props) $$invalidate(15, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		createEventDispatcher,
    		ROUTER,
    		LOCATION,
    		navigate,
    		startsWith,
    		resolve,
    		shouldNavigate,
    		to,
    		replace,
    		state,
    		getProps,
    		base,
    		location,
    		dispatch,
    		href,
    		isPartiallyCurrent,
    		isCurrent,
    		props,
    		onClick,
    		$base,
    		$location,
    		ariaCurrent
    	});

    	$$self.$inject_state = $$props => {
    		if ("to" in $$props) $$invalidate(6, to = $$props.to);
    		if ("replace" in $$props) $$invalidate(7, replace = $$props.replace);
    		if ("state" in $$props) $$invalidate(8, state = $$props.state);
    		if ("getProps" in $$props) $$invalidate(9, getProps = $$props.getProps);
    		if ("href" in $$props) $$invalidate(0, href = $$props.href);
    		if ("isPartiallyCurrent" in $$props) $$invalidate(10, isPartiallyCurrent = $$props.isPartiallyCurrent);
    		if ("isCurrent" in $$props) $$invalidate(11, isCurrent = $$props.isCurrent);
    		if ("props" in $$props) $$invalidate(1, props = $$props.props);
    		if ("ariaCurrent" in $$props) $$invalidate(2, ariaCurrent = $$props.ariaCurrent);
    	};

    	let ariaCurrent;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*to, $base*/ 4160) {
    			 $$invalidate(0, href = to === "/" ? $base.uri : resolve(to, $base.uri));
    		}

    		if ($$self.$$.dirty & /*$location, href*/ 8193) {
    			 $$invalidate(10, isPartiallyCurrent = startsWith($location.pathname, href));
    		}

    		if ($$self.$$.dirty & /*href, $location*/ 8193) {
    			 $$invalidate(11, isCurrent = href === $location.pathname);
    		}

    		if ($$self.$$.dirty & /*isCurrent*/ 2048) {
    			 $$invalidate(2, ariaCurrent = isCurrent ? "page" : undefined);
    		}

    		if ($$self.$$.dirty & /*getProps, $location, href, isPartiallyCurrent, isCurrent*/ 11777) {
    			 $$invalidate(1, props = getProps({
    				location: $location,
    				href,
    				isPartiallyCurrent,
    				isCurrent
    			}));
    		}
    	};

    	return [
    		href,
    		props,
    		ariaCurrent,
    		base,
    		location,
    		onClick,
    		to,
    		replace,
    		state,
    		getProps,
    		isPartiallyCurrent,
    		isCurrent,
    		$base,
    		$location,
    		dispatch,
    		$$scope,
    		$$slots
    	];
    }

    class Link extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { to: 6, replace: 7, state: 8, getProps: 9 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Link",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get to() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set to(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get replace() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set replace(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get state() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set state(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getProps() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set getProps(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\layout\Sidebar.svelte generated by Svelte v3.19.2 */
    const file$2 = "src\\layout\\Sidebar.svelte";

    // (84:12) <Link to = "dashboard">
    function create_default_slot_1(ctx) {
    	let span;
    	let i;
    	let t0;
    	let p;

    	const block = {
    		c: function create() {
    			span = element("span");
    			i = element("i");
    			t0 = space();
    			p = element("p");
    			p.textContent = "Dashboard";
    			attr_dev(i, "class", "nav-icon fas fa-tachometer-alt");
    			add_location(i, file$2, 85, 14, 2407);
    			add_location(p, file$2, 86, 14, 2469);
    			attr_dev(span, "class", "nav-link active");
    			add_location(span, file$2, 84, 12, 2361);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, i);
    			append_dev(span, t0);
    			append_dev(span, p);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(84:12) <Link to = \\\"dashboard\\\">",
    		ctx
    	});

    	return block;
    }

    // (102:12) {#if masterdatachild_visible}
    function create_if_block$1(ctx) {
    	let ul;
    	let li0;
    	let t0;
    	let li1;
    	let a0;
    	let i0;
    	let t1;
    	let p0;
    	let t3;
    	let li2;
    	let a1;
    	let i1;
    	let t4;
    	let p1;
    	let t6;
    	let li3;
    	let a2;
    	let i2;
    	let t7;
    	let p2;
    	let ul_transition;
    	let current;

    	const link = new Link({
    			props: {
    				to: "pengguna",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			li0 = element("li");
    			create_component(link.$$.fragment);
    			t0 = space();
    			li1 = element("li");
    			a0 = element("a");
    			i0 = element("i");
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "Produk";
    			t3 = space();
    			li2 = element("li");
    			a1 = element("a");
    			i1 = element("i");
    			t4 = space();
    			p1 = element("p");
    			p1.textContent = "Beautician";
    			t6 = space();
    			li3 = element("li");
    			a2 = element("a");
    			i2 = element("i");
    			t7 = space();
    			p2 = element("p");
    			p2.textContent = "Beautician";
    			attr_dev(li0, "class", "nav-item");
    			add_location(li0, file$2, 104, 14, 3040);
    			attr_dev(i0, "class", "far fa-circle nav-icon");
    			add_location(i0, file$2, 114, 18, 3442);
    			add_location(p0, file$2, 115, 18, 3500);
    			attr_dev(a0, "href", "pages/layout/top-nav-sidebar.html");
    			attr_dev(a0, "class", "nav-link");
    			add_location(a0, file$2, 113, 16, 3361);
    			attr_dev(li1, "class", "nav-item");
    			add_location(li1, file$2, 112, 14, 3322);
    			attr_dev(i1, "class", "far fa-circle nav-icon");
    			add_location(i1, file$2, 120, 18, 3692);
    			add_location(p1, file$2, 121, 18, 3750);
    			attr_dev(a1, "href", "pages/layout/top-nav-sidebar.html");
    			attr_dev(a1, "class", "nav-link");
    			add_location(a1, file$2, 119, 16, 3611);
    			attr_dev(li2, "class", "nav-item");
    			add_location(li2, file$2, 118, 14, 3572);
    			attr_dev(i2, "class", "far fa-circle nav-icon");
    			add_location(i2, file$2, 126, 18, 3946);
    			add_location(p2, file$2, 127, 18, 4004);
    			attr_dev(a2, "href", "pages/layout/top-nav-sidebar.html");
    			attr_dev(a2, "class", "nav-link");
    			add_location(a2, file$2, 125, 16, 3865);
    			attr_dev(li3, "class", "nav-item");
    			add_location(li3, file$2, 124, 14, 3826);
    			attr_dev(ul, "class", "nav");
    			add_location(ul, file$2, 103, 12, 2961);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li0);
    			mount_component(link, li0, null);
    			append_dev(ul, t0);
    			append_dev(ul, li1);
    			append_dev(li1, a0);
    			append_dev(a0, i0);
    			append_dev(a0, t1);
    			append_dev(a0, p0);
    			append_dev(ul, t3);
    			append_dev(ul, li2);
    			append_dev(li2, a1);
    			append_dev(a1, i1);
    			append_dev(a1, t4);
    			append_dev(a1, p1);
    			append_dev(ul, t6);
    			append_dev(ul, li3);
    			append_dev(li3, a2);
    			append_dev(a2, i2);
    			append_dev(a2, t7);
    			append_dev(a2, p2);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(link.$$.fragment, local);

    			add_render_callback(() => {
    				if (!ul_transition) ul_transition = create_bidirectional_transition(ul, slide, { y: 100, duration: 300 }, true);
    				ul_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link.$$.fragment, local);
    			if (!ul_transition) ul_transition = create_bidirectional_transition(ul, slide, { y: 100, duration: 300 }, false);
    			ul_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			destroy_component(link);
    			if (detaching && ul_transition) ul_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(102:12) {#if masterdatachild_visible}",
    		ctx
    	});

    	return block;
    }

    // (106:15) <Link to = "pengguna">
    function create_default_slot(ctx) {
    	let span;
    	let i;
    	let t0;
    	let p;

    	const block = {
    		c: function create() {
    			span = element("span");
    			i = element("i");
    			t0 = space();
    			p = element("p");
    			p.textContent = "Pengguna";
    			attr_dev(i, "class", "far fa-user nav-icon");
    			add_location(i, file$2, 107, 20, 3163);
    			add_location(p, file$2, 108, 20, 3221);
    			attr_dev(span, "class", "nav-link");
    			add_location(span, file$2, 106, 16, 3118);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, i);
    			append_dev(span, t0);
    			append_dev(span, p);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(106:15) <Link to = \\\"pengguna\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let aside;
    	let a0;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let span;
    	let t1;
    	let t2;
    	let t3;
    	let div3;
    	let div2;
    	let div0;
    	let img1;
    	let img1_src_value;
    	let t4;
    	let div1;
    	let a1;
    	let t6;
    	let nav0;
    	let ul3;
    	let li0;
    	let t7;
    	let li1;
    	let a2;
    	let i0;
    	let t8;
    	let p0;
    	let t9;
    	let i1;
    	let t10;
    	let t11;
    	let li4;
    	let a3;
    	let i2;
    	let t12;
    	let p1;
    	let t13;
    	let i3;
    	let t14;
    	let ul0;
    	let li2;
    	let a4;
    	let i4;
    	let t15;
    	let p2;
    	let t17;
    	let li3;
    	let a5;
    	let i5;
    	let t18;
    	let p3;
    	let t20;
    	let li7;
    	let a6;
    	let i6;
    	let t21;
    	let p4;
    	let t22;
    	let i7;
    	let t23;
    	let ul1;
    	let li5;
    	let a7;
    	let i8;
    	let t24;
    	let p5;
    	let t26;
    	let li6;
    	let a8;
    	let i9;
    	let t27;
    	let p6;
    	let t29;
    	let li16;
    	let a9;
    	let i10;
    	let t30;
    	let p7;
    	let t31;
    	let i11;
    	let t32;
    	let ul2;
    	let li8;
    	let a10;
    	let i12;
    	let t33;
    	let p8;
    	let t35;
    	let li9;
    	let a11;
    	let i13;
    	let t36;
    	let p9;
    	let t38;
    	let li10;
    	let a12;
    	let i14;
    	let t39;
    	let p10;
    	let t41;
    	let li11;
    	let a13;
    	let i15;
    	let t42;
    	let p11;
    	let t44;
    	let li12;
    	let a14;
    	let i16;
    	let t45;
    	let p12;
    	let t47;
    	let li13;
    	let a15;
    	let i17;
    	let t48;
    	let p13;
    	let t50;
    	let li14;
    	let a16;
    	let i18;
    	let t51;
    	let p14;
    	let t53;
    	let li15;
    	let a17;
    	let i19;
    	let t54;
    	let p15;
    	let t56;
    	let nav1;
    	let ul4;
    	let li17;
    	let a18;
    	let i20;
    	let t57;
    	let ul5;
    	let li18;
    	let a19;
    	let i21;
    	let current;
    	let dispose;

    	const link = new Link({
    			props: {
    				to: "dashboard",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let if_block = /*masterdatachild_visible*/ ctx[3] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			aside = element("aside");
    			a0 = element("a");
    			img0 = element("img");
    			t0 = space();
    			span = element("span");
    			t1 = text("Lumera ");
    			t2 = text(/*container_margin*/ ctx[0]);
    			t3 = space();
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			img1 = element("img");
    			t4 = space();
    			div1 = element("div");
    			a1 = element("a");
    			a1.textContent = "Administrator";
    			t6 = space();
    			nav0 = element("nav");
    			ul3 = element("ul");
    			li0 = element("li");
    			create_component(link.$$.fragment);
    			t7 = space();
    			li1 = element("li");
    			a2 = element("a");
    			i0 = element("i");
    			t8 = space();
    			p0 = element("p");
    			t9 = text("Master Data\r\n                ");
    			i1 = element("i");
    			t10 = space();
    			if (if_block) if_block.c();
    			t11 = space();
    			li4 = element("li");
    			a3 = element("a");
    			i2 = element("i");
    			t12 = space();
    			p1 = element("p");
    			t13 = text("Pembelian\r\n                ");
    			i3 = element("i");
    			t14 = space();
    			ul0 = element("ul");
    			li2 = element("li");
    			a4 = element("a");
    			i4 = element("i");
    			t15 = space();
    			p2 = element("p");
    			p2.textContent = "Produk Kecantikan";
    			t17 = space();
    			li3 = element("li");
    			a5 = element("a");
    			i5 = element("i");
    			t18 = space();
    			p3 = element("p");
    			p3.textContent = "Jasa";
    			t20 = space();
    			li7 = element("li");
    			a6 = element("a");
    			i6 = element("i");
    			t21 = space();
    			p4 = element("p");
    			t22 = text("Penjualan\r\n                ");
    			i7 = element("i");
    			t23 = space();
    			ul1 = element("ul");
    			li5 = element("li");
    			a7 = element("a");
    			i8 = element("i");
    			t24 = space();
    			p5 = element("p");
    			p5.textContent = "Produk Kecantikan";
    			t26 = space();
    			li6 = element("li");
    			a8 = element("a");
    			i9 = element("i");
    			t27 = space();
    			p6 = element("p");
    			p6.textContent = "Jasa";
    			t29 = space();
    			li16 = element("li");
    			a9 = element("a");
    			i10 = element("i");
    			t30 = space();
    			p7 = element("p");
    			t31 = text("Laporan\r\n                ");
    			i11 = element("i");
    			t32 = space();
    			ul2 = element("ul");
    			li8 = element("li");
    			a10 = element("a");
    			i12 = element("i");
    			t33 = space();
    			p8 = element("p");
    			p8.textContent = "General";
    			t35 = space();
    			li9 = element("li");
    			a11 = element("a");
    			i13 = element("i");
    			t36 = space();
    			p9 = element("p");
    			p9.textContent = "Icons";
    			t38 = space();
    			li10 = element("li");
    			a12 = element("a");
    			i14 = element("i");
    			t39 = space();
    			p10 = element("p");
    			p10.textContent = "Buttons";
    			t41 = space();
    			li11 = element("li");
    			a13 = element("a");
    			i15 = element("i");
    			t42 = space();
    			p11 = element("p");
    			p11.textContent = "Sliders";
    			t44 = space();
    			li12 = element("li");
    			a14 = element("a");
    			i16 = element("i");
    			t45 = space();
    			p12 = element("p");
    			p12.textContent = "Modals & Alerts";
    			t47 = space();
    			li13 = element("li");
    			a15 = element("a");
    			i17 = element("i");
    			t48 = space();
    			p13 = element("p");
    			p13.textContent = "Navbar & Tabs";
    			t50 = space();
    			li14 = element("li");
    			a16 = element("a");
    			i18 = element("i");
    			t51 = space();
    			p14 = element("p");
    			p14.textContent = "Timeline";
    			t53 = space();
    			li15 = element("li");
    			a17 = element("a");
    			i19 = element("i");
    			t54 = space();
    			p15 = element("p");
    			p15.textContent = "Ribbons";
    			t56 = space();
    			nav1 = element("nav");
    			ul4 = element("ul");
    			li17 = element("li");
    			a18 = element("a");
    			i20 = element("i");
    			t57 = space();
    			ul5 = element("ul");
    			li18 = element("li");
    			a19 = element("a");
    			i21 = element("i");
    			if (img0.src !== (img0_src_value = "../public/assets/img/logo.jpeg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Lumere Logo");
    			attr_dev(img0, "class", "brand-image img-circle elevation-3");
    			set_style(img0, "opacity", ".8");
    			add_location(img0, file$2, 63, 6, 1444);
    			attr_dev(span, "class", "brand-text font-weight-light");
    			add_location(span, file$2, 65, 6, 1587);
    			attr_dev(a0, "href", "#");
    			attr_dev(a0, "class", "brand-link");
    			add_location(a0, file$2, 62, 4, 1405);
    			if (img1.src !== (img1_src_value = "dist/img/user2-160x160.jpg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "class", "img-circle elevation-2");
    			attr_dev(img1, "alt", "User Image");
    			add_location(img1, file$2, 73, 10, 1864);
    			attr_dev(div0, "class", "image");
    			add_location(div0, file$2, 72, 8, 1833);
    			attr_dev(a1, "href", "#");
    			attr_dev(a1, "class", "d-block");
    			add_location(a1, file$2, 76, 10, 2006);
    			attr_dev(div1, "class", "info");
    			add_location(div1, file$2, 75, 8, 1976);
    			attr_dev(div2, "class", "user-panel mt-3 pb-3 mb-3 d-flex");
    			add_location(div2, file$2, 71, 6, 1777);
    			attr_dev(li0, "class", "nav-item has-treeview menu-open");
    			add_location(li0, file$2, 82, 10, 2266);
    			attr_dev(i0, "class", "nav-icon fas fa-database");
    			add_location(i0, file$2, 94, 14, 2717);
    			attr_dev(i1, "class", "fas fa-angle-left right");
    			add_location(i1, file$2, 97, 16, 2823);
    			add_location(p0, file$2, 95, 14, 2773);
    			attr_dev(a2, "href", "#");
    			attr_dev(a2, "class", "nav-link");
    			add_location(a2, file$2, 93, 12, 2672);
    			attr_dev(li1, "class", "nav-item has-treeview");
    			add_location(li1, file$2, 92, 10, 2585);
    			attr_dev(i2, "class", "nav-icon fas fa-cart-plus");
    			add_location(i2, file$2, 137, 14, 4228);
    			attr_dev(i3, "class", "right fas fa-angle-left");
    			add_location(i3, file$2, 140, 16, 4333);
    			add_location(p1, file$2, 138, 14, 4285);
    			attr_dev(a3, "href", "#");
    			attr_dev(a3, "class", "nav-link");
    			add_location(a3, file$2, 136, 12, 4183);
    			attr_dev(i4, "class", "far fa-circle nav-icon");
    			add_location(i4, file$2, 146, 18, 4581);
    			add_location(p2, file$2, 147, 18, 4639);
    			attr_dev(a4, "href", "pages/charts/chartjs.html");
    			attr_dev(a4, "class", "nav-link");
    			add_location(a4, file$2, 145, 16, 4508);
    			attr_dev(li2, "class", "nav-item");
    			add_location(li2, file$2, 144, 14, 4469);
    			attr_dev(i5, "class", "far fa-circle nav-icon");
    			add_location(i5, file$2, 152, 18, 4831);
    			add_location(p3, file$2, 153, 18, 4889);
    			attr_dev(a5, "href", "pages/charts/flot.html");
    			attr_dev(a5, "class", "nav-link");
    			add_location(a5, file$2, 151, 16, 4761);
    			attr_dev(li3, "class", "nav-item");
    			add_location(li3, file$2, 150, 14, 4722);
    			attr_dev(ul0, "class", "nav nav-treeview");
    			add_location(ul0, file$2, 143, 12, 4424);
    			attr_dev(li4, "class", "nav-item has-treeview");
    			add_location(li4, file$2, 135, 10, 4135);
    			attr_dev(i6, "class", "nav-icon fas fa-fax");
    			add_location(i6, file$2, 160, 14, 5084);
    			attr_dev(i7, "class", "right fas fa-angle-left");
    			add_location(i7, file$2, 163, 16, 5183);
    			add_location(p4, file$2, 161, 14, 5135);
    			attr_dev(a6, "href", "#");
    			attr_dev(a6, "class", "nav-link");
    			add_location(a6, file$2, 159, 12, 5039);
    			attr_dev(i8, "class", "far fa-circle nav-icon");
    			add_location(i8, file$2, 169, 18, 5431);
    			add_location(p5, file$2, 170, 18, 5489);
    			attr_dev(a7, "href", "pages/charts/chartjs.html");
    			attr_dev(a7, "class", "nav-link");
    			add_location(a7, file$2, 168, 16, 5358);
    			attr_dev(li5, "class", "nav-item");
    			add_location(li5, file$2, 167, 14, 5319);
    			attr_dev(i9, "class", "far fa-circle nav-icon");
    			add_location(i9, file$2, 175, 18, 5681);
    			add_location(p6, file$2, 176, 18, 5739);
    			attr_dev(a8, "href", "pages/charts/flot.html");
    			attr_dev(a8, "class", "nav-link");
    			add_location(a8, file$2, 174, 16, 5611);
    			attr_dev(li6, "class", "nav-item");
    			add_location(li6, file$2, 173, 14, 5572);
    			attr_dev(ul1, "class", "nav nav-treeview");
    			add_location(ul1, file$2, 166, 12, 5274);
    			attr_dev(li7, "class", "nav-item has-treeview");
    			add_location(li7, file$2, 158, 10, 4991);
    			attr_dev(i10, "class", "nav-icon fas fa-print");
    			add_location(i10, file$2, 183, 14, 5934);
    			attr_dev(i11, "class", "fas fa-angle-left right");
    			add_location(i11, file$2, 186, 16, 6033);
    			add_location(p7, file$2, 184, 14, 5987);
    			attr_dev(a9, "href", "#");
    			attr_dev(a9, "class", "nav-link");
    			add_location(a9, file$2, 182, 12, 5889);
    			attr_dev(i12, "class", "far fa-circle nav-icon");
    			add_location(i12, file$2, 192, 18, 6277);
    			add_location(p8, file$2, 193, 18, 6335);
    			attr_dev(a10, "href", "pages/UI/general.html");
    			attr_dev(a10, "class", "nav-link");
    			add_location(a10, file$2, 191, 16, 6208);
    			attr_dev(li8, "class", "nav-item");
    			add_location(li8, file$2, 190, 14, 6169);
    			attr_dev(i13, "class", "far fa-circle nav-icon");
    			add_location(i13, file$2, 198, 18, 6514);
    			add_location(p9, file$2, 199, 18, 6572);
    			attr_dev(a11, "href", "pages/UI/icons.html");
    			attr_dev(a11, "class", "nav-link");
    			add_location(a11, file$2, 197, 16, 6447);
    			attr_dev(li9, "class", "nav-item");
    			add_location(li9, file$2, 196, 14, 6408);
    			attr_dev(i14, "class", "far fa-circle nav-icon");
    			add_location(i14, file$2, 204, 18, 6751);
    			add_location(p10, file$2, 205, 18, 6809);
    			attr_dev(a12, "href", "pages/UI/buttons.html");
    			attr_dev(a12, "class", "nav-link");
    			add_location(a12, file$2, 203, 16, 6682);
    			attr_dev(li10, "class", "nav-item");
    			add_location(li10, file$2, 202, 14, 6643);
    			attr_dev(i15, "class", "far fa-circle nav-icon");
    			add_location(i15, file$2, 210, 18, 6990);
    			add_location(p11, file$2, 211, 18, 7048);
    			attr_dev(a13, "href", "pages/UI/sliders.html");
    			attr_dev(a13, "class", "nav-link");
    			add_location(a13, file$2, 209, 16, 6921);
    			attr_dev(li11, "class", "nav-item");
    			add_location(li11, file$2, 208, 14, 6882);
    			attr_dev(i16, "class", "far fa-circle nav-icon");
    			add_location(i16, file$2, 216, 18, 7228);
    			add_location(p12, file$2, 217, 18, 7286);
    			attr_dev(a14, "href", "pages/UI/modals.html");
    			attr_dev(a14, "class", "nav-link");
    			add_location(a14, file$2, 215, 16, 7160);
    			attr_dev(li12, "class", "nav-item");
    			add_location(li12, file$2, 214, 14, 7121);
    			attr_dev(i17, "class", "far fa-circle nav-icon");
    			add_location(i17, file$2, 222, 18, 7474);
    			add_location(p13, file$2, 223, 18, 7532);
    			attr_dev(a15, "href", "pages/UI/navbar.html");
    			attr_dev(a15, "class", "nav-link");
    			add_location(a15, file$2, 221, 16, 7406);
    			attr_dev(li13, "class", "nav-item");
    			add_location(li13, file$2, 220, 14, 7367);
    			attr_dev(i18, "class", "far fa-circle nav-icon");
    			add_location(i18, file$2, 228, 18, 7720);
    			add_location(p14, file$2, 229, 18, 7778);
    			attr_dev(a16, "href", "pages/UI/timeline.html");
    			attr_dev(a16, "class", "nav-link");
    			add_location(a16, file$2, 227, 16, 7650);
    			attr_dev(li14, "class", "nav-item");
    			add_location(li14, file$2, 226, 14, 7611);
    			attr_dev(i19, "class", "far fa-circle nav-icon");
    			add_location(i19, file$2, 234, 18, 7960);
    			add_location(p15, file$2, 235, 18, 8018);
    			attr_dev(a17, "href", "pages/UI/ribbons.html");
    			attr_dev(a17, "class", "nav-link");
    			add_location(a17, file$2, 233, 16, 7891);
    			attr_dev(li15, "class", "nav-item");
    			add_location(li15, file$2, 232, 14, 7852);
    			attr_dev(ul2, "class", "nav nav-treeview");
    			add_location(ul2, file$2, 189, 12, 6124);
    			attr_dev(li16, "class", "nav-item has-treeview");
    			add_location(li16, file$2, 181, 10, 5841);
    			attr_dev(ul3, "class", "nav nav-pills nav-sidebar flex-column");
    			attr_dev(ul3, "data-widget", "treeview");
    			attr_dev(ul3, "role", "menu");
    			attr_dev(ul3, "data-accordion", "false");
    			add_location(ul3, file$2, 81, 8, 2146);
    			attr_dev(nav0, "class", "mt-2");
    			add_location(nav0, file$2, 80, 6, 2118);
    			attr_dev(div3, "class", "sidebar");
    			add_location(div3, file$2, 69, 4, 1702);
    			attr_dev(aside, "class", "main-sidebar sidebar-dark-primary elevation-4 sidebar-anim svelte-1llvbsg");
    			set_style(aside, "position", "fixed");
    			set_style(aside, "height", "100vh");
    			set_style(aside, "transform", "translateX(" + /*sidebar_visible*/ ctx[1] + "px)");
    			add_location(aside, file$2, 60, 2, 1218);
    			attr_dev(i20, "class", "fas fa-bars");
    			add_location(i20, file$2, 252, 67, 8522);
    			attr_dev(a18, "class", "nav-link");
    			attr_dev(a18, "role", "button");
    			add_location(a18, file$2, 252, 8, 8463);
    			attr_dev(li17, "class", "nav-item");
    			add_location(li17, file$2, 251, 6, 8432);
    			attr_dev(ul4, "class", "navbar-nav");
    			add_location(ul4, file$2, 250, 4, 8401);
    			attr_dev(i21, "class", "fas fa-cogs");
    			add_location(i21, file$2, 258, 99, 8777);
    			attr_dev(a19, "class", "nav-link");
    			attr_dev(a19, "data-widget", "control-sidebar");
    			attr_dev(a19, "data-slide", "true");
    			attr_dev(a19, "href", "#");
    			attr_dev(a19, "role", "button");
    			add_location(a19, file$2, 258, 8, 8686);
    			attr_dev(li18, "class", "nav-item");
    			add_location(li18, file$2, 257, 6, 8655);
    			attr_dev(ul5, "class", "navbar-nav ml-auto");
    			add_location(ul5, file$2, 256, 4, 8616);
    			attr_dev(nav1, "class", "main-header navbar navbar-expand navbar-dark");
    			set_style(nav1, "margin-left", /*navbar_margin*/ ctx[2] + "px");
    			set_style(nav1, "transition", "all 0.3s linear");
    			add_location(nav1, file$2, 248, 2, 8240);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, aside, anchor);
    			append_dev(aside, a0);
    			append_dev(a0, img0);
    			append_dev(a0, t0);
    			append_dev(a0, span);
    			append_dev(span, t1);
    			append_dev(span, t2);
    			append_dev(aside, t3);
    			append_dev(aside, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, img1);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, a1);
    			append_dev(div3, t6);
    			append_dev(div3, nav0);
    			append_dev(nav0, ul3);
    			append_dev(ul3, li0);
    			mount_component(link, li0, null);
    			append_dev(ul3, t7);
    			append_dev(ul3, li1);
    			append_dev(li1, a2);
    			append_dev(a2, i0);
    			append_dev(a2, t8);
    			append_dev(a2, p0);
    			append_dev(p0, t9);
    			append_dev(p0, i1);
    			append_dev(li1, t10);
    			if (if_block) if_block.m(li1, null);
    			append_dev(ul3, t11);
    			append_dev(ul3, li4);
    			append_dev(li4, a3);
    			append_dev(a3, i2);
    			append_dev(a3, t12);
    			append_dev(a3, p1);
    			append_dev(p1, t13);
    			append_dev(p1, i3);
    			append_dev(li4, t14);
    			append_dev(li4, ul0);
    			append_dev(ul0, li2);
    			append_dev(li2, a4);
    			append_dev(a4, i4);
    			append_dev(a4, t15);
    			append_dev(a4, p2);
    			append_dev(ul0, t17);
    			append_dev(ul0, li3);
    			append_dev(li3, a5);
    			append_dev(a5, i5);
    			append_dev(a5, t18);
    			append_dev(a5, p3);
    			append_dev(ul3, t20);
    			append_dev(ul3, li7);
    			append_dev(li7, a6);
    			append_dev(a6, i6);
    			append_dev(a6, t21);
    			append_dev(a6, p4);
    			append_dev(p4, t22);
    			append_dev(p4, i7);
    			append_dev(li7, t23);
    			append_dev(li7, ul1);
    			append_dev(ul1, li5);
    			append_dev(li5, a7);
    			append_dev(a7, i8);
    			append_dev(a7, t24);
    			append_dev(a7, p5);
    			append_dev(ul1, t26);
    			append_dev(ul1, li6);
    			append_dev(li6, a8);
    			append_dev(a8, i9);
    			append_dev(a8, t27);
    			append_dev(a8, p6);
    			append_dev(ul3, t29);
    			append_dev(ul3, li16);
    			append_dev(li16, a9);
    			append_dev(a9, i10);
    			append_dev(a9, t30);
    			append_dev(a9, p7);
    			append_dev(p7, t31);
    			append_dev(p7, i11);
    			append_dev(li16, t32);
    			append_dev(li16, ul2);
    			append_dev(ul2, li8);
    			append_dev(li8, a10);
    			append_dev(a10, i12);
    			append_dev(a10, t33);
    			append_dev(a10, p8);
    			append_dev(ul2, t35);
    			append_dev(ul2, li9);
    			append_dev(li9, a11);
    			append_dev(a11, i13);
    			append_dev(a11, t36);
    			append_dev(a11, p9);
    			append_dev(ul2, t38);
    			append_dev(ul2, li10);
    			append_dev(li10, a12);
    			append_dev(a12, i14);
    			append_dev(a12, t39);
    			append_dev(a12, p10);
    			append_dev(ul2, t41);
    			append_dev(ul2, li11);
    			append_dev(li11, a13);
    			append_dev(a13, i15);
    			append_dev(a13, t42);
    			append_dev(a13, p11);
    			append_dev(ul2, t44);
    			append_dev(ul2, li12);
    			append_dev(li12, a14);
    			append_dev(a14, i16);
    			append_dev(a14, t45);
    			append_dev(a14, p12);
    			append_dev(ul2, t47);
    			append_dev(ul2, li13);
    			append_dev(li13, a15);
    			append_dev(a15, i17);
    			append_dev(a15, t48);
    			append_dev(a15, p13);
    			append_dev(ul2, t50);
    			append_dev(ul2, li14);
    			append_dev(li14, a16);
    			append_dev(a16, i18);
    			append_dev(a16, t51);
    			append_dev(a16, p14);
    			append_dev(ul2, t53);
    			append_dev(ul2, li15);
    			append_dev(li15, a17);
    			append_dev(a17, i19);
    			append_dev(a17, t54);
    			append_dev(a17, p15);
    			insert_dev(target, t56, anchor);
    			insert_dev(target, nav1, anchor);
    			append_dev(nav1, ul4);
    			append_dev(ul4, li17);
    			append_dev(li17, a18);
    			append_dev(a18, i20);
    			append_dev(nav1, t57);
    			append_dev(nav1, ul5);
    			append_dev(ul5, li18);
    			append_dev(li18, a19);
    			append_dev(a19, i21);
    			current = true;

    			dispose = [
    				listen_dev(li1, "click", /*click_handler*/ ctx[7], false, false, false),
    				listen_dev(a18, "click", /*toggleSidebar*/ ctx[4], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*container_margin*/ 1) set_data_dev(t2, /*container_margin*/ ctx[0]);
    			const link_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				link_changes.$$scope = { dirty, ctx };
    			}

    			link.$set(link_changes);

    			if (/*masterdatachild_visible*/ ctx[3]) {
    				if (!if_block) {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(li1, null);
    				} else {
    					transition_in(if_block, 1);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*sidebar_visible*/ 2) {
    				set_style(aside, "transform", "translateX(" + /*sidebar_visible*/ ctx[1] + "px)");
    			}

    			if (!current || dirty & /*navbar_margin*/ 4) {
    				set_style(nav1, "margin-left", /*navbar_margin*/ ctx[2] + "px");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(link.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(aside);
    			destroy_component(link);
    			if (if_block) if_block.d();
    			if (detaching) detach_dev(t56);
    			if (detaching) detach_dev(nav1);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let container_margin = 0;
    	let sidebar_visible = 0;
    	let navbar_margin = 250;
    	let masterdatachild_visible = false;

    	function toggleSidebar() {
    		if (sidebar_visible == 0) {
    			$$invalidate(2, navbar_margin = 0);
    			$$invalidate(0, container_margin = 0);
    			dispatch("message", { text: container_margin });

    			setTimeout(
    				() => {
    					$$invalidate(1, sidebar_visible = -250);
    				},
    				100
    			);
    		} else {
    			$$invalidate(1, sidebar_visible = 0);

    			setTimeout(
    				() => {
    					$$invalidate(0, container_margin = 250);
    					$$invalidate(2, navbar_margin = 250);
    					dispatch("message", { text: container_margin });
    				},
    				295
    			);
    		}
    	}

    	function toggleNav(parameter) {
    		if (parameter == "masterdata") {
    			if (masterdatachild_visible == true) {
    				$$invalidate(3, masterdatachild_visible = false);
    			} else {
    				$$invalidate(3, masterdatachild_visible = true);
    			}
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Sidebar> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Sidebar", $$slots, []);
    	const click_handler = () => toggleNav("masterdata");

    	$$self.$capture_state = () => ({
    		Navbar,
    		fade,
    		fly,
    		slide,
    		Router,
    		Link,
    		Route,
    		createEventDispatcher,
    		dispatch,
    		container_margin,
    		sidebar_visible,
    		navbar_margin,
    		masterdatachild_visible,
    		toggleSidebar,
    		toggleNav
    	});

    	$$self.$inject_state = $$props => {
    		if ("container_margin" in $$props) $$invalidate(0, container_margin = $$props.container_margin);
    		if ("sidebar_visible" in $$props) $$invalidate(1, sidebar_visible = $$props.sidebar_visible);
    		if ("navbar_margin" in $$props) $$invalidate(2, navbar_margin = $$props.navbar_margin);
    		if ("masterdatachild_visible" in $$props) $$invalidate(3, masterdatachild_visible = $$props.masterdatachild_visible);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		container_margin,
    		sidebar_visible,
    		navbar_margin,
    		masterdatachild_visible,
    		toggleSidebar,
    		toggleNav,
    		dispatch,
    		click_handler
    	];
    }

    class Sidebar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sidebar",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\Pages\Pengguna.svelte generated by Svelte v3.19.2 */
    const file$3 = "src\\Pages\\Pengguna.svelte";

    // (16:42) <Link to = "dashboard">
    function create_default_slot_1$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Dashboard");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(16:42) <Link to = \\\"dashboard\\\">",
    		ctx
    	});

    	return block;
    }

    // (35:16) <Link to = "tambahpengguna">
    function create_default_slot$1(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Tambah Pengguna";
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "btn btn-block bg-gradient-primary");
    			add_location(button, file$3, 35, 16, 1169);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(35:16) <Link to = \\\"tambahpengguna\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div14;
    	let section0;
    	let div3;
    	let div2;
    	let div0;
    	let h1;
    	let t0;
    	let div1;
    	let ol;
    	let li0;
    	let t1;
    	let li1;
    	let t3;
    	let section1;
    	let div13;
    	let div12;
    	let div11;
    	let div10;
    	let div4;
    	let h30;
    	let i0;
    	let t4;
    	let t5;
    	let t6;
    	let div8;
    	let h31;
    	let t8;
    	let div7;
    	let div6;
    	let input;
    	let t9;
    	let div5;
    	let button;
    	let i1;
    	let t10;
    	let div9;
    	let table;
    	let thead;
    	let tr0;
    	let th0;
    	let t12;
    	let th1;
    	let t14;
    	let th2;
    	let t16;
    	let th3;
    	let t18;
    	let th4;
    	let t20;
    	let tbody;
    	let tr1;
    	let td0;
    	let t22;
    	let td1;
    	let t24;
    	let td2;
    	let t26;
    	let td3;
    	let span0;
    	let t28;
    	let td4;
    	let t30;
    	let tr2;
    	let td5;
    	let t32;
    	let td6;
    	let t34;
    	let td7;
    	let t36;
    	let td8;
    	let span1;
    	let t38;
    	let td9;
    	let t40;
    	let tr3;
    	let td10;
    	let t42;
    	let td11;
    	let t44;
    	let td12;
    	let t46;
    	let td13;
    	let span2;
    	let t48;
    	let td14;
    	let t50;
    	let tr4;
    	let td15;
    	let t52;
    	let td16;
    	let t54;
    	let td17;
    	let t56;
    	let td18;
    	let span3;
    	let t58;
    	let td19;
    	let t60;
    	let footer;
    	let div15;
    	let b;
    	let t62;
    	let t63;
    	let strong;
    	let t64;
    	let a;
    	let t66;
    	let t67;
    	let current;

    	const link0 = new Link({
    			props: {
    				to: "dashboard",
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const link1 = new Link({
    			props: {
    				to: "tambahpengguna",
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div14 = element("div");
    			section0 = element("section");
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			t0 = space();
    			div1 = element("div");
    			ol = element("ol");
    			li0 = element("li");
    			create_component(link0.$$.fragment);
    			t1 = space();
    			li1 = element("li");
    			li1.textContent = "Pengguna";
    			t3 = space();
    			section1 = element("section");
    			div13 = element("div");
    			div12 = element("div");
    			div11 = element("div");
    			div10 = element("div");
    			div4 = element("div");
    			h30 = element("h3");
    			i0 = element("i");
    			t4 = text("\r\n                  Pengguna");
    			t5 = space();
    			create_component(link1.$$.fragment);
    			t6 = space();
    			div8 = element("div");
    			h31 = element("h3");
    			h31.textContent = "Responsive Hover Table";
    			t8 = space();
    			div7 = element("div");
    			div6 = element("div");
    			input = element("input");
    			t9 = space();
    			div5 = element("div");
    			button = element("button");
    			i1 = element("i");
    			t10 = space();
    			div9 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr0 = element("tr");
    			th0 = element("th");
    			th0.textContent = "ID";
    			t12 = space();
    			th1 = element("th");
    			th1.textContent = "User";
    			t14 = space();
    			th2 = element("th");
    			th2.textContent = "Date";
    			t16 = space();
    			th3 = element("th");
    			th3.textContent = "Status";
    			t18 = space();
    			th4 = element("th");
    			th4.textContent = "Reason";
    			t20 = space();
    			tbody = element("tbody");
    			tr1 = element("tr");
    			td0 = element("td");
    			td0.textContent = "183";
    			t22 = space();
    			td1 = element("td");
    			td1.textContent = "John Doe";
    			t24 = space();
    			td2 = element("td");
    			td2.textContent = "11-7-2014";
    			t26 = space();
    			td3 = element("td");
    			span0 = element("span");
    			span0.textContent = "Approved";
    			t28 = space();
    			td4 = element("td");
    			td4.textContent = "Bacon ipsum dolor sit amet salami venison chicken flank fatback doner.";
    			t30 = space();
    			tr2 = element("tr");
    			td5 = element("td");
    			td5.textContent = "219";
    			t32 = space();
    			td6 = element("td");
    			td6.textContent = "Alexander Pierce";
    			t34 = space();
    			td7 = element("td");
    			td7.textContent = "11-7-2014";
    			t36 = space();
    			td8 = element("td");
    			span1 = element("span");
    			span1.textContent = "Pending";
    			t38 = space();
    			td9 = element("td");
    			td9.textContent = "Bacon ipsum dolor sit amet salami venison chicken flank fatback doner.";
    			t40 = space();
    			tr3 = element("tr");
    			td10 = element("td");
    			td10.textContent = "657";
    			t42 = space();
    			td11 = element("td");
    			td11.textContent = "Bob Doe";
    			t44 = space();
    			td12 = element("td");
    			td12.textContent = "11-7-2014";
    			t46 = space();
    			td13 = element("td");
    			span2 = element("span");
    			span2.textContent = "Approved";
    			t48 = space();
    			td14 = element("td");
    			td14.textContent = "Bacon ipsum dolor sit amet salami venison chicken flank fatback doner.";
    			t50 = space();
    			tr4 = element("tr");
    			td15 = element("td");
    			td15.textContent = "175";
    			t52 = space();
    			td16 = element("td");
    			td16.textContent = "Mike Doe";
    			t54 = space();
    			td17 = element("td");
    			td17.textContent = "11-7-2014";
    			t56 = space();
    			td18 = element("td");
    			span3 = element("span");
    			span3.textContent = "Denied";
    			t58 = space();
    			td19 = element("td");
    			td19.textContent = "Bacon ipsum dolor sit amet salami venison chicken flank fatback doner.";
    			t60 = space();
    			footer = element("footer");
    			div15 = element("div");
    			b = element("b");
    			b.textContent = "Version";
    			t62 = text(" 1.0");
    			t63 = space();
    			strong = element("strong");
    			t64 = text("Copyright © 2020 ");
    			a = element("a");
    			a.textContent = "Lumera System";
    			t66 = text(".");
    			t67 = text(" All rights\r\n    reserved.");
    			add_location(h1, file$3, 11, 12, 334);
    			attr_dev(div0, "class", "col-sm-6");
    			add_location(div0, file$3, 10, 10, 298);
    			attr_dev(li0, "class", "breadcrumb-item");
    			add_location(li0, file$3, 15, 14, 463);
    			attr_dev(li1, "class", "breadcrumb-item active");
    			add_location(li1, file$3, 16, 14, 551);
    			attr_dev(ol, "class", "breadcrumb float-sm-right");
    			add_location(ol, file$3, 14, 12, 409);
    			attr_dev(div1, "class", "col-sm-6");
    			add_location(div1, file$3, 13, 10, 373);
    			attr_dev(div2, "class", "row mb-2");
    			add_location(div2, file$3, 9, 8, 264);
    			attr_dev(div3, "class", "container-fluid");
    			add_location(div3, file$3, 8, 6, 225);
    			attr_dev(section0, "class", "content-header");
    			add_location(section0, file$3, 7, 4, 185);
    			attr_dev(i0, "class", "fas fa-user");
    			add_location(i0, file$3, 31, 18, 1027);
    			attr_dev(h30, "class", "card-title");
    			add_location(h30, file$3, 30, 16, 984);
    			attr_dev(div4, "class", "card-header");
    			add_location(div4, file$3, 29, 14, 941);
    			attr_dev(h31, "class", "card-title");
    			add_location(h31, file$3, 39, 14, 1361);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "name", "table_search");
    			attr_dev(input, "class", "form-control float-right");
    			attr_dev(input, "placeholder", "Search");
    			add_location(input, file$3, 43, 20, 1559);
    			attr_dev(i1, "class", "fas fa-search");
    			add_location(i1, file$3, 46, 68, 1778);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "btn btn-default");
    			add_location(button, file$3, 46, 22, 1732);
    			attr_dev(div5, "class", "input-group-append");
    			add_location(div5, file$3, 45, 20, 1676);
    			attr_dev(div6, "class", "input-group input-group-sm");
    			set_style(div6, "width", "150px");
    			add_location(div6, file$3, 42, 18, 1475);
    			attr_dev(div7, "class", "card-tools");
    			add_location(div7, file$3, 41, 16, 1431);
    			attr_dev(div8, "class", "card-header");
    			add_location(div8, file$3, 38, 14, 1320);
    			add_location(th0, file$3, 56, 22, 2154);
    			add_location(th1, file$3, 57, 22, 2189);
    			add_location(th2, file$3, 58, 22, 2226);
    			add_location(th3, file$3, 59, 22, 2263);
    			add_location(th4, file$3, 60, 22, 2302);
    			add_location(tr0, file$3, 55, 20, 2126);
    			add_location(thead, file$3, 54, 18, 2097);
    			add_location(td0, file$3, 65, 22, 2449);
    			add_location(td1, file$3, 66, 22, 2485);
    			add_location(td2, file$3, 67, 22, 2526);
    			attr_dev(span0, "class", "tag tag-success");
    			add_location(span0, file$3, 68, 26, 2572);
    			add_location(td3, file$3, 68, 22, 2568);
    			add_location(td4, file$3, 69, 22, 2646);
    			add_location(tr1, file$3, 64, 20, 2421);
    			add_location(td5, file$3, 72, 22, 2802);
    			add_location(td6, file$3, 73, 22, 2838);
    			add_location(td7, file$3, 74, 22, 2887);
    			attr_dev(span1, "class", "tag tag-warning");
    			add_location(span1, file$3, 75, 26, 2933);
    			add_location(td8, file$3, 75, 22, 2929);
    			add_location(td9, file$3, 76, 22, 3006);
    			add_location(tr2, file$3, 71, 20, 2774);
    			add_location(td10, file$3, 79, 22, 3162);
    			add_location(td11, file$3, 80, 22, 3198);
    			add_location(td12, file$3, 81, 22, 3238);
    			attr_dev(span2, "class", "tag tag-primary");
    			add_location(span2, file$3, 82, 26, 3284);
    			add_location(td13, file$3, 82, 22, 3280);
    			add_location(td14, file$3, 83, 22, 3358);
    			add_location(tr3, file$3, 78, 20, 3134);
    			add_location(td15, file$3, 86, 22, 3514);
    			add_location(td16, file$3, 87, 22, 3550);
    			add_location(td17, file$3, 88, 22, 3591);
    			attr_dev(span3, "class", "tag tag-danger");
    			add_location(span3, file$3, 89, 26, 3637);
    			add_location(td18, file$3, 89, 22, 3633);
    			add_location(td19, file$3, 90, 22, 3708);
    			add_location(tr4, file$3, 85, 20, 3486);
    			add_location(tbody, file$3, 63, 18, 2392);
    			attr_dev(table, "class", "table table-hover text-nowrap");
    			add_location(table, file$3, 53, 16, 2032);
    			attr_dev(div9, "class", "card-body table-responsive p-0");
    			add_location(div9, file$3, 52, 14, 1970);
    			attr_dev(div10, "class", "card card-primary card-outline");
    			add_location(div10, file$3, 28, 12, 881);
    			attr_dev(div11, "class", "col-md-12");
    			add_location(div11, file$3, 27, 10, 844);
    			attr_dev(div12, "class", "row");
    			add_location(div12, file$3, 26, 8, 815);
    			attr_dev(div13, "class", "container-fluid");
    			add_location(div13, file$3, 25, 6, 776);
    			attr_dev(section1, "class", "content");
    			add_location(section1, file$3, 24, 4, 743);
    			add_location(div14, file$3, 5, 2, 130);
    			add_location(b, file$3, 104, 6, 4137);
    			attr_dev(div15, "class", "float-right d-none d-sm-block");
    			add_location(div15, file$3, 103, 4, 4086);
    			attr_dev(a, "href", "#");
    			add_location(a, file$3, 106, 34, 4203);
    			add_location(strong, file$3, 106, 4, 4173);
    			attr_dev(footer, "class", "main-footer");
    			add_location(footer, file$3, 102, 2, 4052);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div14, anchor);
    			append_dev(div14, section0);
    			append_dev(section0, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, h1);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, ol);
    			append_dev(ol, li0);
    			mount_component(link0, li0, null);
    			append_dev(ol, t1);
    			append_dev(ol, li1);
    			append_dev(div14, t3);
    			append_dev(div14, section1);
    			append_dev(section1, div13);
    			append_dev(div13, div12);
    			append_dev(div12, div11);
    			append_dev(div11, div10);
    			append_dev(div10, div4);
    			append_dev(div4, h30);
    			append_dev(h30, i0);
    			append_dev(h30, t4);
    			append_dev(div4, t5);
    			mount_component(link1, div4, null);
    			append_dev(div10, t6);
    			append_dev(div10, div8);
    			append_dev(div8, h31);
    			append_dev(div8, t8);
    			append_dev(div8, div7);
    			append_dev(div7, div6);
    			append_dev(div6, input);
    			append_dev(div6, t9);
    			append_dev(div6, div5);
    			append_dev(div5, button);
    			append_dev(button, i1);
    			append_dev(div10, t10);
    			append_dev(div10, div9);
    			append_dev(div9, table);
    			append_dev(table, thead);
    			append_dev(thead, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t12);
    			append_dev(tr0, th1);
    			append_dev(tr0, t14);
    			append_dev(tr0, th2);
    			append_dev(tr0, t16);
    			append_dev(tr0, th3);
    			append_dev(tr0, t18);
    			append_dev(tr0, th4);
    			append_dev(table, t20);
    			append_dev(table, tbody);
    			append_dev(tbody, tr1);
    			append_dev(tr1, td0);
    			append_dev(tr1, t22);
    			append_dev(tr1, td1);
    			append_dev(tr1, t24);
    			append_dev(tr1, td2);
    			append_dev(tr1, t26);
    			append_dev(tr1, td3);
    			append_dev(td3, span0);
    			append_dev(tr1, t28);
    			append_dev(tr1, td4);
    			append_dev(tbody, t30);
    			append_dev(tbody, tr2);
    			append_dev(tr2, td5);
    			append_dev(tr2, t32);
    			append_dev(tr2, td6);
    			append_dev(tr2, t34);
    			append_dev(tr2, td7);
    			append_dev(tr2, t36);
    			append_dev(tr2, td8);
    			append_dev(td8, span1);
    			append_dev(tr2, t38);
    			append_dev(tr2, td9);
    			append_dev(tbody, t40);
    			append_dev(tbody, tr3);
    			append_dev(tr3, td10);
    			append_dev(tr3, t42);
    			append_dev(tr3, td11);
    			append_dev(tr3, t44);
    			append_dev(tr3, td12);
    			append_dev(tr3, t46);
    			append_dev(tr3, td13);
    			append_dev(td13, span2);
    			append_dev(tr3, t48);
    			append_dev(tr3, td14);
    			append_dev(tbody, t50);
    			append_dev(tbody, tr4);
    			append_dev(tr4, td15);
    			append_dev(tr4, t52);
    			append_dev(tr4, td16);
    			append_dev(tr4, t54);
    			append_dev(tr4, td17);
    			append_dev(tr4, t56);
    			append_dev(tr4, td18);
    			append_dev(td18, span3);
    			append_dev(tr4, t58);
    			append_dev(tr4, td19);
    			insert_dev(target, t60, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div15);
    			append_dev(div15, b);
    			append_dev(div15, t62);
    			append_dev(footer, t63);
    			append_dev(footer, strong);
    			append_dev(strong, t64);
    			append_dev(strong, a);
    			append_dev(strong, t66);
    			append_dev(footer, t67);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const link0_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				link0_changes.$$scope = { dirty, ctx };
    			}

    			link0.$set(link0_changes);
    			const link1_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				link1_changes.$$scope = { dirty, ctx };
    			}

    			link1.$set(link1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(link0.$$.fragment, local);
    			transition_in(link1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link0.$$.fragment, local);
    			transition_out(link1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div14);
    			destroy_component(link0);
    			destroy_component(link1);
    			if (detaching) detach_dev(t60);
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Pengguna> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Pengguna", $$slots, []);
    	$$self.$capture_state = () => ({ Router, Link, Route });
    	return [];
    }

    class Pengguna extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Pengguna",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\Pages\TambahPengguna.svelte generated by Svelte v3.19.2 */
    const file$4 = "src\\Pages\\TambahPengguna.svelte";

    // (16:42) <Link to = "dashboard">
    function create_default_slot_1$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Dashboard");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$2.name,
    		type: "slot",
    		source: "(16:42) <Link to = \\\"dashboard\\\">",
    		ctx
    	});

    	return block;
    }

    // (17:42) <Link to = "pengguna">
    function create_default_slot$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Pengguna");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(17:42) <Link to = \\\"pengguna\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div15;
    	let section0;
    	let div3;
    	let div2;
    	let div0;
    	let h1;
    	let t0;
    	let div1;
    	let ol;
    	let li0;
    	let t1;
    	let li1;
    	let t2;
    	let li2;
    	let t4;
    	let section1;
    	let div14;
    	let div13;
    	let div12;
    	let div11;
    	let div4;
    	let h3;
    	let i;
    	let t5;
    	let t6;
    	let form;
    	let div9;
    	let div5;
    	let label0;
    	let t8;
    	let input0;
    	let t9;
    	let div6;
    	let label1;
    	let t11;
    	let input1;
    	let t12;
    	let div7;
    	let label2;
    	let t14;
    	let input2;
    	let t15;
    	let div8;
    	let label3;
    	let t17;
    	let select;
    	let option0;
    	let option1;
    	let option2;
    	let t21;
    	let div10;
    	let button;
    	let t23;
    	let footer;
    	let div16;
    	let b;
    	let t25;
    	let t26;
    	let strong;
    	let t27;
    	let a;
    	let t29;
    	let t30;
    	let current;

    	const link0 = new Link({
    			props: {
    				to: "dashboard",
    				$$slots: { default: [create_default_slot_1$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const link1 = new Link({
    			props: {
    				to: "pengguna",
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div15 = element("div");
    			section0 = element("section");
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			t0 = space();
    			div1 = element("div");
    			ol = element("ol");
    			li0 = element("li");
    			create_component(link0.$$.fragment);
    			t1 = space();
    			li1 = element("li");
    			create_component(link1.$$.fragment);
    			t2 = space();
    			li2 = element("li");
    			li2.textContent = "Tambah Pengguna";
    			t4 = space();
    			section1 = element("section");
    			div14 = element("div");
    			div13 = element("div");
    			div12 = element("div");
    			div11 = element("div");
    			div4 = element("div");
    			h3 = element("h3");
    			i = element("i");
    			t5 = text("Tambah Pengguna");
    			t6 = space();
    			form = element("form");
    			div9 = element("div");
    			div5 = element("div");
    			label0 = element("label");
    			label0.textContent = "Nama";
    			t8 = space();
    			input0 = element("input");
    			t9 = space();
    			div6 = element("div");
    			label1 = element("label");
    			label1.textContent = "Username";
    			t11 = space();
    			input1 = element("input");
    			t12 = space();
    			div7 = element("div");
    			label2 = element("label");
    			label2.textContent = "Password";
    			t14 = space();
    			input2 = element("input");
    			t15 = space();
    			div8 = element("div");
    			label3 = element("label");
    			label3.textContent = "Hak Akses";
    			t17 = space();
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "-PILIH-";
    			option1 = element("option");
    			option1.textContent = "Administrator";
    			option2 = element("option");
    			option2.textContent = "Kasir";
    			t21 = space();
    			div10 = element("div");
    			button = element("button");
    			button.textContent = "Submit";
    			t23 = space();
    			footer = element("footer");
    			div16 = element("div");
    			b = element("b");
    			b.textContent = "Version";
    			t25 = text(" 1.0");
    			t26 = space();
    			strong = element("strong");
    			t27 = text("Copyright © 2020 ");
    			a = element("a");
    			a.textContent = "Lumera System";
    			t29 = text(".");
    			t30 = text(" All rights\r\n    reserved.");
    			add_location(h1, file$4, 11, 12, 357);
    			attr_dev(div0, "class", "col-sm-6");
    			add_location(div0, file$4, 10, 10, 321);
    			attr_dev(li0, "class", "breadcrumb-item");
    			add_location(li0, file$4, 15, 14, 486);
    			attr_dev(li1, "class", "breadcrumb-item");
    			add_location(li1, file$4, 16, 14, 574);
    			attr_dev(li2, "class", "breadcrumb-item active");
    			add_location(li2, file$4, 17, 14, 660);
    			attr_dev(ol, "class", "breadcrumb float-sm-right");
    			add_location(ol, file$4, 14, 12, 432);
    			attr_dev(div1, "class", "col-sm-6");
    			add_location(div1, file$4, 13, 10, 396);
    			attr_dev(div2, "class", "row mb-2");
    			add_location(div2, file$4, 9, 8, 287);
    			attr_dev(div3, "class", "container-fluid");
    			add_location(div3, file$4, 8, 6, 248);
    			attr_dev(section0, "class", "content-header");
    			add_location(section0, file$4, 7, 4, 208);
    			attr_dev(i, "class", "fas fa-user-plus");
    			add_location(i, file$4, 33, 39, 1186);
    			attr_dev(h3, "class", "card-title");
    			add_location(h3, file$4, 33, 16, 1163);
    			attr_dev(div4, "class", "card-header");
    			add_location(div4, file$4, 32, 14, 1120);
    			attr_dev(label0, "for", "name");
    			add_location(label0, file$4, 40, 20, 1474);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "id", "name");
    			attr_dev(input0, "placeholder", "Masukkan Nama");
    			add_location(input0, file$4, 41, 20, 1526);
    			attr_dev(div5, "class", "form-group");
    			add_location(div5, file$4, 39, 18, 1428);
    			attr_dev(label1, "for", "username");
    			add_location(label1, file$4, 44, 20, 1696);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "form-control");
    			attr_dev(input1, "id", "username");
    			attr_dev(input1, "placeholder", "Masukkan Username");
    			add_location(input1, file$4, 45, 20, 1756);
    			attr_dev(div6, "class", "form-group");
    			add_location(div6, file$4, 43, 18, 1650);
    			attr_dev(label2, "for", "password");
    			add_location(label2, file$4, 48, 20, 1934);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "class", "form-control");
    			attr_dev(input2, "id", "password");
    			attr_dev(input2, "placeholder", "Masukkan Password");
    			add_location(input2, file$4, 49, 20, 1994);
    			attr_dev(div7, "class", "form-group");
    			add_location(div7, file$4, 47, 18, 1888);
    			add_location(label3, file$4, 52, 24, 2176);
    			option0.__value = "-PILIH-";
    			option0.value = option0.__value;
    			add_location(option0, file$4, 54, 26, 2283);
    			option1.__value = "Administrator";
    			option1.value = option1.__value;
    			add_location(option1, file$4, 55, 26, 2335);
    			option2.__value = "Kasir";
    			option2.value = option2.__value;
    			add_location(option2, file$4, 56, 26, 2393);
    			attr_dev(select, "class", "form-control");
    			add_location(select, file$4, 53, 24, 2226);
    			attr_dev(div8, "class", "form-group");
    			add_location(div8, file$4, 51, 18, 2126);
    			attr_dev(div9, "class", "card-body");
    			add_location(div9, file$4, 38, 16, 1385);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "btn btn-primary");
    			add_location(button, file$4, 64, 18, 2627);
    			attr_dev(div10, "class", "card-footer");
    			add_location(div10, file$4, 63, 16, 2582);
    			attr_dev(form, "role", "form");
    			add_location(form, file$4, 37, 14, 1349);
    			attr_dev(div11, "class", "card card-primary");
    			add_location(div11, file$4, 31, 12, 1073);
    			attr_dev(div12, "class", "col-md-12");
    			add_location(div12, file$4, 29, 10, 992);
    			attr_dev(div13, "class", "row");
    			add_location(div13, file$4, 27, 8, 931);
    			attr_dev(div14, "class", "container-fluid");
    			add_location(div14, file$4, 26, 6, 892);
    			attr_dev(section1, "class", "content");
    			add_location(section1, file$4, 25, 4, 859);
    			attr_dev(div15, "class", "content-wrapper");
    			add_location(div15, file$4, 5, 2, 130);
    			add_location(b, file$4, 81, 6, 3067);
    			attr_dev(div16, "class", "float-right d-none d-sm-block");
    			add_location(div16, file$4, 80, 4, 3016);
    			attr_dev(a, "href", "#");
    			add_location(a, file$4, 83, 34, 3133);
    			add_location(strong, file$4, 83, 4, 3103);
    			attr_dev(footer, "class", "main-footer");
    			add_location(footer, file$4, 79, 2, 2982);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div15, anchor);
    			append_dev(div15, section0);
    			append_dev(section0, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, h1);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, ol);
    			append_dev(ol, li0);
    			mount_component(link0, li0, null);
    			append_dev(ol, t1);
    			append_dev(ol, li1);
    			mount_component(link1, li1, null);
    			append_dev(ol, t2);
    			append_dev(ol, li2);
    			append_dev(div15, t4);
    			append_dev(div15, section1);
    			append_dev(section1, div14);
    			append_dev(div14, div13);
    			append_dev(div13, div12);
    			append_dev(div12, div11);
    			append_dev(div11, div4);
    			append_dev(div4, h3);
    			append_dev(h3, i);
    			append_dev(h3, t5);
    			append_dev(div11, t6);
    			append_dev(div11, form);
    			append_dev(form, div9);
    			append_dev(div9, div5);
    			append_dev(div5, label0);
    			append_dev(div5, t8);
    			append_dev(div5, input0);
    			append_dev(div9, t9);
    			append_dev(div9, div6);
    			append_dev(div6, label1);
    			append_dev(div6, t11);
    			append_dev(div6, input1);
    			append_dev(div9, t12);
    			append_dev(div9, div7);
    			append_dev(div7, label2);
    			append_dev(div7, t14);
    			append_dev(div7, input2);
    			append_dev(div9, t15);
    			append_dev(div9, div8);
    			append_dev(div8, label3);
    			append_dev(div8, t17);
    			append_dev(div8, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(select, option2);
    			append_dev(form, t21);
    			append_dev(form, div10);
    			append_dev(div10, button);
    			insert_dev(target, t23, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div16);
    			append_dev(div16, b);
    			append_dev(div16, t25);
    			append_dev(footer, t26);
    			append_dev(footer, strong);
    			append_dev(strong, t27);
    			append_dev(strong, a);
    			append_dev(strong, t29);
    			append_dev(footer, t30);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const link0_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				link0_changes.$$scope = { dirty, ctx };
    			}

    			link0.$set(link0_changes);
    			const link1_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				link1_changes.$$scope = { dirty, ctx };
    			}

    			link1.$set(link1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(link0.$$.fragment, local);
    			transition_in(link1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link0.$$.fragment, local);
    			transition_out(link1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div15);
    			destroy_component(link0);
    			destroy_component(link1);
    			if (detaching) detach_dev(t23);
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TambahPengguna> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("TambahPengguna", $$slots, []);
    	$$self.$capture_state = () => ({ Router, Link, Route });
    	return [];
    }

    class TambahPengguna extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TambahPengguna",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\Pages\Dashboard.svelte generated by Svelte v3.19.2 */

    function create_fragment$7(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Dashboard> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Dashboard", $$slots, []);
    	return [];
    }

    class Dashboard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Dashboard",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.19.2 */
    const file$5 = "src\\App.svelte";

    // (21:0) <Router>
    function create_default_slot$3(ctx) {
    	let t0;
    	let div;
    	let t1;
    	let t2;
    	let current;
    	const sidebar = new Sidebar({ $$inline: true });
    	sidebar.$on("message", /*handleMessage*/ ctx[1]);

    	const route0 = new Route({
    			props: { path: "dashboard", component: Dashboard },
    			$$inline: true
    		});

    	const route1 = new Route({
    			props: { path: "pengguna", component: Pengguna },
    			$$inline: true
    		});

    	const route2 = new Route({
    			props: {
    				path: "tambahpengguna",
    				component: TambahPengguna
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(sidebar.$$.fragment);
    			t0 = space();
    			div = element("div");
    			create_component(route0.$$.fragment);
    			t1 = space();
    			create_component(route1.$$.fragment);
    			t2 = space();
    			create_component(route2.$$.fragment);
    			attr_dev(div, "class", "content-wrapper");
    			set_style(div, "margin-left", /*containerMarginVisibletoSidebar*/ ctx[0] + "px");
    			add_location(div, file$5, 22, 3, 595);
    		},
    		m: function mount(target, anchor) {
    			mount_component(sidebar, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			mount_component(route0, div, null);
    			append_dev(div, t1);
    			mount_component(route1, div, null);
    			append_dev(div, t2);
    			mount_component(route2, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*containerMarginVisibletoSidebar*/ 1) {
    				set_style(div, "margin-left", /*containerMarginVisibletoSidebar*/ ctx[0] + "px");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sidebar.$$.fragment, local);
    			transition_in(route0.$$.fragment, local);
    			transition_in(route1.$$.fragment, local);
    			transition_in(route2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sidebar.$$.fragment, local);
    			transition_out(route0.$$.fragment, local);
    			transition_out(route1.$$.fragment, local);
    			transition_out(route2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(sidebar, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			destroy_component(route0);
    			destroy_component(route1);
    			destroy_component(route2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(21:0) <Router>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let current;

    	const router = new Router({
    			props: {
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(router.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const router_changes = {};

    			if (dirty & /*$$scope, containerMarginVisibletoSidebar*/ 5) {
    				router_changes.$$scope = { dirty, ctx };
    			}

    			router.$set(router_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(router, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let containerMarginVisibletoSidebar = 250;

    	function handleMessage(event) {
    		$$invalidate(0, containerMarginVisibletoSidebar = event.detail.text);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$capture_state = () => ({
    		Sidebar,
    		Pengguna,
    		TambahPengguna,
    		Dashboard,
    		Router,
    		Link,
    		Route,
    		containerMarginVisibletoSidebar,
    		handleMessage
    	});

    	$$self.$inject_state = $$props => {
    		if ("containerMarginVisibletoSidebar" in $$props) $$invalidate(0, containerMarginVisibletoSidebar = $$props.containerMarginVisibletoSidebar);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [containerMarginVisibletoSidebar, handleMessage];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
