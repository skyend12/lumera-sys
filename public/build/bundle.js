
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
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
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
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
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

    /* src/layout/Navbar.svelte generated by Svelte v3.19.2 */

    const file = "src/layout/Navbar.svelte";

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
    			add_location(i0, file, 13, 74, 280);
    			attr_dev(a0, "class", "nav-link");
    			attr_dev(a0, "data-widget", "pushmenu");
    			attr_dev(a0, "href", "#");
    			attr_dev(a0, "role", "button");
    			add_location(a0, file, 13, 8, 214);
    			attr_dev(li0, "class", "nav-item");
    			add_location(li0, file, 12, 6, 184);
    			attr_dev(ul0, "class", "navbar-nav");
    			add_location(ul0, file, 11, 4, 154);
    			attr_dev(i1, "class", "fas fa-cogs");
    			add_location(i1, file, 19, 99, 529);
    			attr_dev(a1, "class", "nav-link");
    			attr_dev(a1, "data-widget", "control-sidebar");
    			attr_dev(a1, "data-slide", "true");
    			attr_dev(a1, "href", "#");
    			attr_dev(a1, "role", "button");
    			add_location(a1, file, 19, 8, 438);
    			attr_dev(li1, "class", "nav-item");
    			add_location(li1, file, 18, 6, 408);
    			attr_dev(ul1, "class", "navbar-nav ml-auto");
    			add_location(ul1, file, 17, 4, 370);
    			attr_dev(nav, "class", "main-header navbar navbar-expand navbar-dark");
    			add_location(nav, file, 9, 2, 60);
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

    /* node_modules/svelte-routing/src/Router.svelte generated by Svelte v3.19.2 */

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

    /* node_modules/svelte-routing/src/Route.svelte generated by Svelte v3.19.2 */

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

    /* node_modules/svelte-routing/src/Link.svelte generated by Svelte v3.19.2 */
    const file$1 = "node_modules/svelte-routing/src/Link.svelte";

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

    /* src/layout/Sidebar.svelte generated by Svelte v3.19.2 */
    const file$2 = "src/layout/Sidebar.svelte";

    // (110:12) <Link to = "dashboard">
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
    			add_location(i, file$2, 111, 14, 3289);
    			add_location(p, file$2, 112, 14, 3350);
    			attr_dev(span, "class", "nav-link active");
    			add_location(span, file$2, 110, 12, 3244);
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
    		source: "(110:12) <Link to = \\\"dashboard\\\">",
    		ctx
    	});

    	return block;
    }

    // (128:12) {#if masterdatachild_visible}
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
    			add_location(li0, file$2, 130, 14, 3903);
    			attr_dev(i0, "class", "far fa-circle nav-icon");
    			add_location(i0, file$2, 140, 18, 4295);
    			add_location(p0, file$2, 141, 18, 4352);
    			attr_dev(a0, "href", "pages/layout/top-nav-sidebar.html");
    			attr_dev(a0, "class", "nav-link");
    			add_location(a0, file$2, 139, 16, 4215);
    			attr_dev(li1, "class", "nav-item");
    			add_location(li1, file$2, 138, 14, 4177);
    			attr_dev(i1, "class", "far fa-circle nav-icon");
    			add_location(i1, file$2, 146, 18, 4539);
    			add_location(p1, file$2, 147, 18, 4596);
    			attr_dev(a1, "href", "pages/layout/top-nav-sidebar.html");
    			attr_dev(a1, "class", "nav-link");
    			add_location(a1, file$2, 145, 16, 4459);
    			attr_dev(li2, "class", "nav-item");
    			add_location(li2, file$2, 144, 14, 4421);
    			attr_dev(i2, "class", "far fa-circle nav-icon");
    			add_location(i2, file$2, 152, 18, 4787);
    			add_location(p2, file$2, 153, 18, 4844);
    			attr_dev(a2, "href", "pages/layout/top-nav-sidebar.html");
    			attr_dev(a2, "class", "nav-link");
    			add_location(a2, file$2, 151, 16, 4707);
    			attr_dev(li3, "class", "nav-item");
    			add_location(li3, file$2, 150, 14, 4669);
    			attr_dev(ul, "class", "nav");
    			add_location(ul, file$2, 129, 12, 3825);
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
    		source: "(128:12) {#if masterdatachild_visible}",
    		ctx
    	});

    	return block;
    }

    // (132:15) <Link to = "pengguna">
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
    			add_location(i, file$2, 133, 20, 4023);
    			add_location(p, file$2, 134, 20, 4080);
    			attr_dev(span, "class", "nav-link");
    			add_location(span, file$2, 132, 16, 3979);
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
    		source: "(132:15) <Link to = \\\"pengguna\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let aside;
    	let div6;
    	let a0;
    	let div2;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let div1;
    	let p0;
    	let t2;
    	let p1;
    	let t4;
    	let div5;
    	let div4;
    	let a1;
    	let img1;
    	let img1_src_value;
    	let t5;
    	let div3;
    	let p2;
    	let t7;
    	let p3;
    	let t9;
    	let hr;
    	let t10;
    	let nav0;
    	let ul3;
    	let li0;
    	let t11;
    	let li1;
    	let a2;
    	let i0;
    	let t12;
    	let p4;
    	let t13;
    	let i1;
    	let t14;
    	let t15;
    	let li4;
    	let a3;
    	let i2;
    	let t16;
    	let p5;
    	let t17;
    	let i3;
    	let t18;
    	let ul0;
    	let li2;
    	let a4;
    	let i4;
    	let t19;
    	let p6;
    	let t21;
    	let li3;
    	let a5;
    	let i5;
    	let t22;
    	let p7;
    	let t24;
    	let li7;
    	let a6;
    	let i6;
    	let t25;
    	let p8;
    	let t26;
    	let i7;
    	let t27;
    	let ul1;
    	let li5;
    	let a7;
    	let i8;
    	let t28;
    	let p9;
    	let t30;
    	let li6;
    	let a8;
    	let i9;
    	let t31;
    	let p10;
    	let t33;
    	let li16;
    	let a9;
    	let i10;
    	let t34;
    	let p11;
    	let t35;
    	let i11;
    	let t36;
    	let ul2;
    	let li8;
    	let a10;
    	let i12;
    	let t37;
    	let p12;
    	let t39;
    	let li9;
    	let a11;
    	let i13;
    	let t40;
    	let p13;
    	let t42;
    	let li10;
    	let a12;
    	let i14;
    	let t43;
    	let p14;
    	let t45;
    	let li11;
    	let a13;
    	let i15;
    	let t46;
    	let p15;
    	let t48;
    	let li12;
    	let a14;
    	let i16;
    	let t49;
    	let p16;
    	let t51;
    	let li13;
    	let a15;
    	let i17;
    	let t52;
    	let p17;
    	let t54;
    	let li14;
    	let a16;
    	let i18;
    	let t55;
    	let p18;
    	let t57;
    	let li15;
    	let a17;
    	let i19;
    	let t58;
    	let p19;
    	let t60;
    	let nav1;
    	let ul4;
    	let li17;
    	let a18;
    	let i20;
    	let t61;
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

    	let if_block = /*masterdatachild_visible*/ ctx[2] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			aside = element("aside");
    			div6 = element("div");
    			a0 = element("a");
    			div2 = element("div");
    			div0 = element("div");
    			img0 = element("img");
    			t0 = space();
    			div1 = element("div");
    			p0 = element("p");
    			p0.textContent = "LumeraSys";
    			t2 = space();
    			p1 = element("p");
    			p1.textContent = "Versi 1.0 rilis 2020";
    			t4 = space();
    			div5 = element("div");
    			div4 = element("div");
    			a1 = element("a");
    			img1 = element("img");
    			t5 = space();
    			div3 = element("div");
    			p2 = element("p");
    			p2.textContent = "Ko Mi Ran";
    			t7 = space();
    			p3 = element("p");
    			p3.textContent = "Administrator";
    			t9 = space();
    			hr = element("hr");
    			t10 = space();
    			nav0 = element("nav");
    			ul3 = element("ul");
    			li0 = element("li");
    			create_component(link.$$.fragment);
    			t11 = space();
    			li1 = element("li");
    			a2 = element("a");
    			i0 = element("i");
    			t12 = space();
    			p4 = element("p");
    			t13 = text("Master Data\n                ");
    			i1 = element("i");
    			t14 = space();
    			if (if_block) if_block.c();
    			t15 = space();
    			li4 = element("li");
    			a3 = element("a");
    			i2 = element("i");
    			t16 = space();
    			p5 = element("p");
    			t17 = text("Pembelian\n                ");
    			i3 = element("i");
    			t18 = space();
    			ul0 = element("ul");
    			li2 = element("li");
    			a4 = element("a");
    			i4 = element("i");
    			t19 = space();
    			p6 = element("p");
    			p6.textContent = "Produk Kecantikan";
    			t21 = space();
    			li3 = element("li");
    			a5 = element("a");
    			i5 = element("i");
    			t22 = space();
    			p7 = element("p");
    			p7.textContent = "Jasa";
    			t24 = space();
    			li7 = element("li");
    			a6 = element("a");
    			i6 = element("i");
    			t25 = space();
    			p8 = element("p");
    			t26 = text("Penjualan\n                ");
    			i7 = element("i");
    			t27 = space();
    			ul1 = element("ul");
    			li5 = element("li");
    			a7 = element("a");
    			i8 = element("i");
    			t28 = space();
    			p9 = element("p");
    			p9.textContent = "Produk Kecantikan";
    			t30 = space();
    			li6 = element("li");
    			a8 = element("a");
    			i9 = element("i");
    			t31 = space();
    			p10 = element("p");
    			p10.textContent = "Jasa";
    			t33 = space();
    			li16 = element("li");
    			a9 = element("a");
    			i10 = element("i");
    			t34 = space();
    			p11 = element("p");
    			t35 = text("Laporan\n                ");
    			i11 = element("i");
    			t36 = space();
    			ul2 = element("ul");
    			li8 = element("li");
    			a10 = element("a");
    			i12 = element("i");
    			t37 = space();
    			p12 = element("p");
    			p12.textContent = "General";
    			t39 = space();
    			li9 = element("li");
    			a11 = element("a");
    			i13 = element("i");
    			t40 = space();
    			p13 = element("p");
    			p13.textContent = "Icons";
    			t42 = space();
    			li10 = element("li");
    			a12 = element("a");
    			i14 = element("i");
    			t43 = space();
    			p14 = element("p");
    			p14.textContent = "Buttons";
    			t45 = space();
    			li11 = element("li");
    			a13 = element("a");
    			i15 = element("i");
    			t46 = space();
    			p15 = element("p");
    			p15.textContent = "Sliders";
    			t48 = space();
    			li12 = element("li");
    			a14 = element("a");
    			i16 = element("i");
    			t49 = space();
    			p16 = element("p");
    			p16.textContent = "Modals & Alerts";
    			t51 = space();
    			li13 = element("li");
    			a15 = element("a");
    			i17 = element("i");
    			t52 = space();
    			p17 = element("p");
    			p17.textContent = "Navbar & Tabs";
    			t54 = space();
    			li14 = element("li");
    			a16 = element("a");
    			i18 = element("i");
    			t55 = space();
    			p18 = element("p");
    			p18.textContent = "Timeline";
    			t57 = space();
    			li15 = element("li");
    			a17 = element("a");
    			i19 = element("i");
    			t58 = space();
    			p19 = element("p");
    			p19.textContent = "Ribbons";
    			t60 = space();
    			nav1 = element("nav");
    			ul4 = element("ul");
    			li17 = element("li");
    			a18 = element("a");
    			i20 = element("i");
    			t61 = space();
    			ul5 = element("ul");
    			li18 = element("li");
    			a19 = element("a");
    			i21 = element("i");
    			if (img0.src !== (img0_src_value = "./assets/img/logo.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Lumera Logo");
    			set_style(img0, "width", "80px");
    			set_style(img0, "height", "80px");
    			add_location(img0, file$2, 82, 10, 2020);
    			attr_dev(div0, "class", "col-4");
    			add_location(div0, file$2, 81, 8, 1990);
    			attr_dev(p0, "class", "brand-text-1 mb-1 font-weight-light svelte-zu9fhm");
    			add_location(p0, file$2, 85, 10, 2169);
    			attr_dev(p1, "class", "brand-text-2 mt-0 font-weight-bold svelte-zu9fhm");
    			add_location(p1, file$2, 86, 10, 2240);
    			attr_dev(div1, "class", "col-6 mt-3 ml-2");
    			add_location(div1, file$2, 84, 8, 2129);
    			attr_dev(div2, "class", "row w-100");
    			add_location(div2, file$2, 80, 6, 1958);
    			attr_dev(a0, "href", "#");
    			attr_dev(a0, "class", "brand-link");
    			add_location(a0, file$2, 79, 4, 1920);
    			attr_dev(img1, "alt", "Image placeholder");
    			if (img1.src !== (img1_src_value = "./assets/img/profile_picture/avatar_1.jpg")) attr_dev(img1, "src", img1_src_value);
    			add_location(img1, file$2, 97, 14, 2632);
    			attr_dev(a1, "href", "javascript:;");
    			attr_dev(a1, "class", "avatar rounded-circle");
    			add_location(a1, file$2, 96, 10, 2564);
    			attr_dev(p2, "class", "user-authorization-name m-0 mb-1 svelte-zu9fhm");
    			add_location(p2, file$2, 100, 12, 2785);
    			attr_dev(p3, "class", "user-authorization-status svelte-zu9fhm");
    			add_location(p3, file$2, 101, 12, 2855);
    			attr_dev(div3, "class", "user-authorization-info svelte-zu9fhm");
    			add_location(div3, file$2, 99, 10, 2735);
    			attr_dev(div4, "class", "user-panel mt-1 ml-0 d-flex elevation-2 pt-3 pl-3 pb-1 svelte-zu9fhm");
    			add_location(div4, file$2, 94, 6, 2447);
    			attr_dev(hr, "class", "mt-3 mb-3");
    			add_location(hr, file$2, 104, 6, 2946);
    			attr_dev(li0, "class", "nav-item has-treeview menu-open");
    			add_location(li0, file$2, 108, 10, 3151);
    			attr_dev(i0, "class", "nav-icon fas fa-database");
    			add_location(i0, file$2, 120, 14, 3590);
    			attr_dev(i1, "class", "fas fa-angle-left right");
    			add_location(i1, file$2, 123, 16, 3693);
    			add_location(p4, file$2, 121, 14, 3645);
    			attr_dev(a2, "href", "#");
    			attr_dev(a2, "class", "nav-link");
    			add_location(a2, file$2, 119, 12, 3546);
    			attr_dev(li1, "class", "nav-item has-treeview");
    			add_location(li1, file$2, 118, 10, 3460);
    			attr_dev(i2, "class", "nav-icon fas fa-cart-plus");
    			add_location(i2, file$2, 163, 14, 5058);
    			attr_dev(i3, "class", "right fas fa-angle-left");
    			add_location(i3, file$2, 166, 16, 5160);
    			add_location(p5, file$2, 164, 14, 5114);
    			attr_dev(a3, "href", "#");
    			attr_dev(a3, "class", "nav-link");
    			add_location(a3, file$2, 162, 12, 5014);
    			attr_dev(i4, "class", "far fa-circle nav-icon");
    			add_location(i4, file$2, 172, 18, 5402);
    			add_location(p6, file$2, 173, 18, 5459);
    			attr_dev(a4, "href", "pages/charts/chartjs.html");
    			attr_dev(a4, "class", "nav-link");
    			add_location(a4, file$2, 171, 16, 5330);
    			attr_dev(li2, "class", "nav-item");
    			add_location(li2, file$2, 170, 14, 5292);
    			attr_dev(i5, "class", "far fa-circle nav-icon");
    			add_location(i5, file$2, 178, 18, 5646);
    			add_location(p7, file$2, 179, 18, 5703);
    			attr_dev(a5, "href", "pages/charts/flot.html");
    			attr_dev(a5, "class", "nav-link");
    			add_location(a5, file$2, 177, 16, 5577);
    			attr_dev(li3, "class", "nav-item");
    			add_location(li3, file$2, 176, 14, 5539);
    			attr_dev(ul0, "class", "nav nav-treeview");
    			add_location(ul0, file$2, 169, 12, 5248);
    			attr_dev(li4, "class", "nav-item has-treeview");
    			add_location(li4, file$2, 161, 10, 4967);
    			attr_dev(i6, "class", "nav-icon fas fa-fax");
    			add_location(i6, file$2, 186, 14, 5891);
    			attr_dev(i7, "class", "right fas fa-angle-left");
    			add_location(i7, file$2, 189, 16, 5987);
    			add_location(p8, file$2, 187, 14, 5941);
    			attr_dev(a6, "href", "#");
    			attr_dev(a6, "class", "nav-link");
    			add_location(a6, file$2, 185, 12, 5847);
    			attr_dev(i8, "class", "far fa-circle nav-icon");
    			add_location(i8, file$2, 195, 18, 6229);
    			add_location(p9, file$2, 196, 18, 6286);
    			attr_dev(a7, "href", "pages/charts/chartjs.html");
    			attr_dev(a7, "class", "nav-link");
    			add_location(a7, file$2, 194, 16, 6157);
    			attr_dev(li5, "class", "nav-item");
    			add_location(li5, file$2, 193, 14, 6119);
    			attr_dev(i9, "class", "far fa-circle nav-icon");
    			add_location(i9, file$2, 201, 18, 6473);
    			add_location(p10, file$2, 202, 18, 6530);
    			attr_dev(a8, "href", "pages/charts/flot.html");
    			attr_dev(a8, "class", "nav-link");
    			add_location(a8, file$2, 200, 16, 6404);
    			attr_dev(li6, "class", "nav-item");
    			add_location(li6, file$2, 199, 14, 6366);
    			attr_dev(ul1, "class", "nav nav-treeview");
    			add_location(ul1, file$2, 192, 12, 6075);
    			attr_dev(li7, "class", "nav-item has-treeview");
    			add_location(li7, file$2, 184, 10, 5800);
    			attr_dev(i10, "class", "nav-icon fas fa-print");
    			add_location(i10, file$2, 209, 14, 6718);
    			attr_dev(i11, "class", "fas fa-angle-left right");
    			add_location(i11, file$2, 212, 16, 6814);
    			add_location(p11, file$2, 210, 14, 6770);
    			attr_dev(a9, "href", "#");
    			attr_dev(a9, "class", "nav-link");
    			add_location(a9, file$2, 208, 12, 6674);
    			attr_dev(i12, "class", "far fa-circle nav-icon");
    			add_location(i12, file$2, 218, 18, 7052);
    			add_location(p12, file$2, 219, 18, 7109);
    			attr_dev(a10, "href", "pages/UI/general.html");
    			attr_dev(a10, "class", "nav-link");
    			add_location(a10, file$2, 217, 16, 6984);
    			attr_dev(li8, "class", "nav-item");
    			add_location(li8, file$2, 216, 14, 6946);
    			attr_dev(i13, "class", "far fa-circle nav-icon");
    			add_location(i13, file$2, 224, 18, 7283);
    			add_location(p13, file$2, 225, 18, 7340);
    			attr_dev(a11, "href", "pages/UI/icons.html");
    			attr_dev(a11, "class", "nav-link");
    			add_location(a11, file$2, 223, 16, 7217);
    			attr_dev(li9, "class", "nav-item");
    			add_location(li9, file$2, 222, 14, 7179);
    			attr_dev(i14, "class", "far fa-circle nav-icon");
    			add_location(i14, file$2, 230, 18, 7514);
    			add_location(p14, file$2, 231, 18, 7571);
    			attr_dev(a12, "href", "pages/UI/buttons.html");
    			attr_dev(a12, "class", "nav-link");
    			add_location(a12, file$2, 229, 16, 7446);
    			attr_dev(li10, "class", "nav-item");
    			add_location(li10, file$2, 228, 14, 7408);
    			attr_dev(i15, "class", "far fa-circle nav-icon");
    			add_location(i15, file$2, 236, 18, 7747);
    			add_location(p15, file$2, 237, 18, 7804);
    			attr_dev(a13, "href", "pages/UI/sliders.html");
    			attr_dev(a13, "class", "nav-link");
    			add_location(a13, file$2, 235, 16, 7679);
    			attr_dev(li11, "class", "nav-item");
    			add_location(li11, file$2, 234, 14, 7641);
    			attr_dev(i16, "class", "far fa-circle nav-icon");
    			add_location(i16, file$2, 242, 18, 7979);
    			add_location(p16, file$2, 243, 18, 8036);
    			attr_dev(a14, "href", "pages/UI/modals.html");
    			attr_dev(a14, "class", "nav-link");
    			add_location(a14, file$2, 241, 16, 7912);
    			attr_dev(li12, "class", "nav-item");
    			add_location(li12, file$2, 240, 14, 7874);
    			attr_dev(i17, "class", "far fa-circle nav-icon");
    			add_location(i17, file$2, 248, 18, 8219);
    			add_location(p17, file$2, 249, 18, 8276);
    			attr_dev(a15, "href", "pages/UI/navbar.html");
    			attr_dev(a15, "class", "nav-link");
    			add_location(a15, file$2, 247, 16, 8152);
    			attr_dev(li13, "class", "nav-item");
    			add_location(li13, file$2, 246, 14, 8114);
    			attr_dev(i18, "class", "far fa-circle nav-icon");
    			add_location(i18, file$2, 254, 18, 8459);
    			add_location(p18, file$2, 255, 18, 8516);
    			attr_dev(a16, "href", "pages/UI/timeline.html");
    			attr_dev(a16, "class", "nav-link");
    			add_location(a16, file$2, 253, 16, 8390);
    			attr_dev(li14, "class", "nav-item");
    			add_location(li14, file$2, 252, 14, 8352);
    			attr_dev(i19, "class", "far fa-circle nav-icon");
    			add_location(i19, file$2, 260, 18, 8693);
    			add_location(p19, file$2, 261, 18, 8750);
    			attr_dev(a17, "href", "pages/UI/ribbons.html");
    			attr_dev(a17, "class", "nav-link");
    			add_location(a17, file$2, 259, 16, 8625);
    			attr_dev(li15, "class", "nav-item");
    			add_location(li15, file$2, 258, 14, 8587);
    			attr_dev(ul2, "class", "nav nav-treeview");
    			add_location(ul2, file$2, 215, 12, 6902);
    			attr_dev(li16, "class", "nav-item has-treeview");
    			add_location(li16, file$2, 207, 10, 6627);
    			attr_dev(ul3, "class", "nav nav-pills nav-sidebar flex-column");
    			attr_dev(ul3, "data-widget", "treeview");
    			attr_dev(ul3, "role", "menu");
    			attr_dev(ul3, "data-accordion", "false");
    			add_location(ul3, file$2, 107, 8, 3032);
    			attr_dev(nav0, "class", "mt-2");
    			add_location(nav0, file$2, 106, 6, 3005);
    			attr_dev(div5, "class", "sidebar");
    			add_location(div5, file$2, 92, 4, 2374);
    			attr_dev(div6, "class", "text-white");
    			set_style(div6, "margin", "7px");
    			add_location(div6, file$2, 76, 4, 1845);
    			attr_dev(aside, "class", "main-sidebar bg-primary elevation-4 sidebar-anim svelte-zu9fhm");
    			set_style(aside, "position", "fixed");
    			set_style(aside, "height", "100vh");
    			set_style(aside, "transform", "translateX(" + /*sidebar_visible*/ ctx[0] + "px)");
    			add_location(aside, file$2, 75, 2, 1694);
    			attr_dev(i20, "class", "fas fa-bars");
    			add_location(i20, file$2, 279, 80, 9335);
    			attr_dev(a18, "class", "nav-link text-primary");
    			attr_dev(a18, "role", "button");
    			add_location(a18, file$2, 279, 8, 9263);
    			attr_dev(li17, "class", "nav-item");
    			set_style(li17, "cursor", "pointer");
    			add_location(li17, file$2, 278, 6, 9208);
    			attr_dev(ul4, "class", "navbar-nav");
    			add_location(ul4, file$2, 277, 4, 9178);
    			attr_dev(i21, "class", "fas fa-cogs");
    			add_location(i21, file$2, 285, 99, 9584);
    			attr_dev(a19, "class", "nav-link");
    			attr_dev(a19, "data-widget", "control-sidebar");
    			attr_dev(a19, "data-slide", "true");
    			attr_dev(a19, "href", "#");
    			attr_dev(a19, "role", "button");
    			add_location(a19, file$2, 285, 8, 9493);
    			attr_dev(li18, "class", "nav-item");
    			add_location(li18, file$2, 284, 6, 9463);
    			attr_dev(ul5, "class", "navbar-nav ml-auto");
    			add_location(ul5, file$2, 283, 4, 9425);
    			attr_dev(nav1, "class", "main-header navbar navbar-expand");
    			set_style(nav1, "margin-left", /*navbar_margin*/ ctx[1] + "px");
    			set_style(nav1, "transition", "all 0.5s linear");
    			set_style(nav1, "padding", "0px 0px 18px 0px ");
    			set_style(nav1, "height", "auto");
    			set_style(nav1, "background-color", "#fff");
    			add_location(nav1, file$2, 275, 2, 8968);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, aside, anchor);
    			append_dev(aside, div6);
    			append_dev(div6, a0);
    			append_dev(a0, div2);
    			append_dev(div2, div0);
    			append_dev(div0, img0);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, p0);
    			append_dev(div1, t2);
    			append_dev(div1, p1);
    			append_dev(div6, t4);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, a1);
    			append_dev(a1, img1);
    			append_dev(div4, t5);
    			append_dev(div4, div3);
    			append_dev(div3, p2);
    			append_dev(div3, t7);
    			append_dev(div3, p3);
    			append_dev(div5, t9);
    			append_dev(div5, hr);
    			append_dev(div5, t10);
    			append_dev(div5, nav0);
    			append_dev(nav0, ul3);
    			append_dev(ul3, li0);
    			mount_component(link, li0, null);
    			append_dev(ul3, t11);
    			append_dev(ul3, li1);
    			append_dev(li1, a2);
    			append_dev(a2, i0);
    			append_dev(a2, t12);
    			append_dev(a2, p4);
    			append_dev(p4, t13);
    			append_dev(p4, i1);
    			append_dev(li1, t14);
    			if (if_block) if_block.m(li1, null);
    			append_dev(ul3, t15);
    			append_dev(ul3, li4);
    			append_dev(li4, a3);
    			append_dev(a3, i2);
    			append_dev(a3, t16);
    			append_dev(a3, p5);
    			append_dev(p5, t17);
    			append_dev(p5, i3);
    			append_dev(li4, t18);
    			append_dev(li4, ul0);
    			append_dev(ul0, li2);
    			append_dev(li2, a4);
    			append_dev(a4, i4);
    			append_dev(a4, t19);
    			append_dev(a4, p6);
    			append_dev(ul0, t21);
    			append_dev(ul0, li3);
    			append_dev(li3, a5);
    			append_dev(a5, i5);
    			append_dev(a5, t22);
    			append_dev(a5, p7);
    			append_dev(ul3, t24);
    			append_dev(ul3, li7);
    			append_dev(li7, a6);
    			append_dev(a6, i6);
    			append_dev(a6, t25);
    			append_dev(a6, p8);
    			append_dev(p8, t26);
    			append_dev(p8, i7);
    			append_dev(li7, t27);
    			append_dev(li7, ul1);
    			append_dev(ul1, li5);
    			append_dev(li5, a7);
    			append_dev(a7, i8);
    			append_dev(a7, t28);
    			append_dev(a7, p9);
    			append_dev(ul1, t30);
    			append_dev(ul1, li6);
    			append_dev(li6, a8);
    			append_dev(a8, i9);
    			append_dev(a8, t31);
    			append_dev(a8, p10);
    			append_dev(ul3, t33);
    			append_dev(ul3, li16);
    			append_dev(li16, a9);
    			append_dev(a9, i10);
    			append_dev(a9, t34);
    			append_dev(a9, p11);
    			append_dev(p11, t35);
    			append_dev(p11, i11);
    			append_dev(li16, t36);
    			append_dev(li16, ul2);
    			append_dev(ul2, li8);
    			append_dev(li8, a10);
    			append_dev(a10, i12);
    			append_dev(a10, t37);
    			append_dev(a10, p12);
    			append_dev(ul2, t39);
    			append_dev(ul2, li9);
    			append_dev(li9, a11);
    			append_dev(a11, i13);
    			append_dev(a11, t40);
    			append_dev(a11, p13);
    			append_dev(ul2, t42);
    			append_dev(ul2, li10);
    			append_dev(li10, a12);
    			append_dev(a12, i14);
    			append_dev(a12, t43);
    			append_dev(a12, p14);
    			append_dev(ul2, t45);
    			append_dev(ul2, li11);
    			append_dev(li11, a13);
    			append_dev(a13, i15);
    			append_dev(a13, t46);
    			append_dev(a13, p15);
    			append_dev(ul2, t48);
    			append_dev(ul2, li12);
    			append_dev(li12, a14);
    			append_dev(a14, i16);
    			append_dev(a14, t49);
    			append_dev(a14, p16);
    			append_dev(ul2, t51);
    			append_dev(ul2, li13);
    			append_dev(li13, a15);
    			append_dev(a15, i17);
    			append_dev(a15, t52);
    			append_dev(a15, p17);
    			append_dev(ul2, t54);
    			append_dev(ul2, li14);
    			append_dev(li14, a16);
    			append_dev(a16, i18);
    			append_dev(a16, t55);
    			append_dev(a16, p18);
    			append_dev(ul2, t57);
    			append_dev(ul2, li15);
    			append_dev(li15, a17);
    			append_dev(a17, i19);
    			append_dev(a17, t58);
    			append_dev(a17, p19);
    			insert_dev(target, t60, anchor);
    			insert_dev(target, nav1, anchor);
    			append_dev(nav1, ul4);
    			append_dev(ul4, li17);
    			append_dev(li17, a18);
    			append_dev(a18, i20);
    			append_dev(nav1, t61);
    			append_dev(nav1, ul5);
    			append_dev(ul5, li18);
    			append_dev(li18, a19);
    			append_dev(a19, i21);
    			current = true;

    			dispose = [
    				listen_dev(li1, "click", /*click_handler*/ ctx[7], false, false, false),
    				listen_dev(a18, "click", /*toggleSidebar*/ ctx[3], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			const link_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				link_changes.$$scope = { dirty, ctx };
    			}

    			link.$set(link_changes);

    			if (/*masterdatachild_visible*/ ctx[2]) {
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

    			if (!current || dirty & /*sidebar_visible*/ 1) {
    				set_style(aside, "transform", "translateX(" + /*sidebar_visible*/ ctx[0] + "px)");
    			}

    			if (!current || dirty & /*navbar_margin*/ 2) {
    				set_style(nav1, "margin-left", /*navbar_margin*/ ctx[1] + "px");
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
    			if (detaching) detach_dev(t60);
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
    			$$invalidate(1, navbar_margin = 0);
    			container_margin = 0;
    			dispatch("message", { text: container_margin });

    			setTimeout(
    				() => {
    					$$invalidate(0, sidebar_visible = -250);
    				},
    				100
    			);
    		} else {
    			$$invalidate(0, sidebar_visible = 0);

    			setTimeout(
    				() => {
    					container_margin = 250;
    					$$invalidate(1, navbar_margin = 250);
    					dispatch("message", { text: container_margin });
    				},
    				100
    			);
    		}
    	}

    	function toggleNav(parameter) {
    		if (parameter == "masterdata") {
    			if (masterdatachild_visible == true) {
    				$$invalidate(2, masterdatachild_visible = false);
    			} else {
    				$$invalidate(2, masterdatachild_visible = true);
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
    		if ("container_margin" in $$props) container_margin = $$props.container_margin;
    		if ("sidebar_visible" in $$props) $$invalidate(0, sidebar_visible = $$props.sidebar_visible);
    		if ("navbar_margin" in $$props) $$invalidate(1, navbar_margin = $$props.navbar_margin);
    		if ("masterdatachild_visible" in $$props) $$invalidate(2, masterdatachild_visible = $$props.masterdatachild_visible);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		sidebar_visible,
    		navbar_margin,
    		masterdatachild_visible,
    		toggleSidebar,
    		toggleNav,
    		container_margin,
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

    /* src/Pages/Pengguna.svelte generated by Svelte v3.19.2 */
    const file$3 = "src/Pages/Pengguna.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (46:42) <Link to = "dashboard">
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
    		source: "(46:42) <Link to = \\\"dashboard\\\">",
    		ctx
    	});

    	return block;
    }

    // (77:18) <Link to="tambahpengguna">
    function create_default_slot$1(ctx) {
    	let button;
    	let i;
    	let t;

    	const block = {
    		c: function create() {
    			button = element("button");
    			i = element("i");
    			t = text(" Tambah Pengguna");
    			attr_dev(i, "class", "fa fa-plus mr-2");
    			add_location(i, file$3, 78, 22, 2445);
    			attr_dev(button, "class", "btn btn-primary btn-round btn-md");
    			add_location(button, file$3, 77, 20, 2373);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, i);
    			append_dev(button, t);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(77:18) <Link to=\\\"tambahpengguna\\\">",
    		ctx
    	});

    	return block;
    }

    // (96:20) {#each user_data as user}
    function create_each_block(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*user*/ ctx[1].id + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*user*/ ctx[1].nama_lengkap + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*user*/ ctx[1].posisi + "";
    	let t4;
    	let t5;
    	let td3;
    	let span;
    	let t6_value = /*user*/ ctx[1].status + "";
    	let t6;
    	let t7;
    	let td4;
    	let button0;
    	let i0;
    	let t8;
    	let button1;
    	let i1;
    	let t9;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td3 = element("td");
    			span = element("span");
    			t6 = text(t6_value);
    			t7 = space();
    			td4 = element("td");
    			button0 = element("button");
    			i0 = element("i");
    			t8 = space();
    			button1 = element("button");
    			i1 = element("i");
    			t9 = space();
    			attr_dev(td0, "class", "text-center");
    			add_location(td0, file$3, 97, 26, 3127);
    			add_location(td1, file$3, 98, 26, 3192);
    			add_location(td2, file$3, 99, 26, 3247);
    			attr_dev(span, "class", "badge badge-success");
    			add_location(span, file$3, 100, 30, 3300);
    			add_location(td3, file$3, 100, 26, 3296);
    			attr_dev(i0, "class", "fa fa-pencil-ruler pt-1");
    			add_location(i0, file$3, 103, 30, 3586);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "rel", "tooltip");
    			attr_dev(button0, "class", "btn btn-info btn-icon btn-sm ");
    			attr_dev(button0, "data-original-title", "");
    			attr_dev(button0, "title", "");
    			add_location(button0, file$3, 102, 28, 3449);
    			attr_dev(i1, "class", "fa fa-trash pt-1");
    			add_location(i1, file$3, 105, 136, 3800);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "rel", "tooltip");
    			attr_dev(button1, "class", "btn btn-danger btn-icon btn-sm ");
    			attr_dev(button1, "data-original-title", "");
    			attr_dev(button1, "title", "");
    			add_location(button1, file$3, 105, 28, 3692);
    			attr_dev(td4, "class", "td-actions text-right");
    			add_location(td4, file$3, 101, 26, 3386);
    			add_location(tr, file$3, 96, 22, 3096);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td3);
    			append_dev(td3, span);
    			append_dev(span, t6);
    			append_dev(tr, t7);
    			append_dev(tr, td4);
    			append_dev(td4, button0);
    			append_dev(button0, i0);
    			append_dev(td4, t8);
    			append_dev(td4, button1);
    			append_dev(button1, i1);
    			append_dev(tr, t9);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(96:20) {#each user_data as user}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
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
    	let t3;
    	let section1;
    	let div14;
    	let div13;
    	let div12;
    	let div11;
    	let div10;
    	let div5;
    	let i0;
    	let t4;
    	let div4;
    	let h5;
    	let t6;
    	let p;
    	let t8;
    	let div9;
    	let div8;
    	let div7;
    	let input;
    	let t9;
    	let div6;
    	let span;
    	let i1;
    	let t10;
    	let t11;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t13;
    	let th1;
    	let t15;
    	let th2;
    	let t17;
    	let th3;
    	let t19;
    	let th4;
    	let t21;
    	let tbody;
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

    	let each_value = /*user_data*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

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
    			li1.textContent = "Pengguna";
    			t3 = space();
    			section1 = element("section");
    			div14 = element("div");
    			div13 = element("div");
    			div12 = element("div");
    			div11 = element("div");
    			div10 = element("div");
    			div5 = element("div");
    			i0 = element("i");
    			t4 = space();
    			div4 = element("div");
    			h5 = element("h5");
    			h5.textContent = "Daftar Pengguna";
    			t6 = space();
    			p = element("p");
    			p.textContent = "Kelola pengguna disini";
    			t8 = space();
    			div9 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			input = element("input");
    			t9 = space();
    			div6 = element("div");
    			span = element("span");
    			i1 = element("i");
    			t10 = space();
    			create_component(link1.$$.fragment);
    			t11 = space();
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "#";
    			t13 = space();
    			th1 = element("th");
    			th1.textContent = "Nama Lengkap";
    			t15 = space();
    			th2 = element("th");
    			th2.textContent = "Posisi";
    			t17 = space();
    			th3 = element("th");
    			th3.textContent = "Status";
    			t19 = space();
    			th4 = element("th");
    			th4.textContent = "Aksi";
    			t21 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h1, file$3, 41, 12, 920);
    			attr_dev(div0, "class", "col-sm-6");
    			add_location(div0, file$3, 40, 10, 885);
    			attr_dev(li0, "class", "breadcrumb-item");
    			add_location(li0, file$3, 45, 14, 1045);
    			attr_dev(li1, "class", "breadcrumb-item active");
    			add_location(li1, file$3, 46, 14, 1132);
    			attr_dev(ol, "class", "breadcrumb float-sm-right");
    			add_location(ol, file$3, 44, 12, 992);
    			attr_dev(div1, "class", "col-sm-6");
    			add_location(div1, file$3, 43, 10, 957);
    			attr_dev(div2, "class", "row mb-2");
    			add_location(div2, file$3, 39, 8, 852);
    			attr_dev(div3, "class", "container-fluid");
    			add_location(div3, file$3, 38, 6, 814);
    			attr_dev(section0, "class", "content-header");
    			add_location(section0, file$3, 37, 4, 775);
    			attr_dev(i0, "class", "fa fa-users mr-3 mt-3 svelte-ige2at");
    			add_location(i0, file$3, 61, 18, 1596);
    			attr_dev(h5, "class", "mb-0");
    			add_location(h5, file$3, 63, 20, 1678);
    			attr_dev(p, "class", "mt-1");
    			add_location(p, file$3, 64, 20, 1736);
    			add_location(div4, file$3, 62, 18, 1652);
    			attr_dev(div5, "class", "page-heading svelte-ige2at");
    			add_location(div5, file$3, 60, 16, 1551);
    			attr_dev(input, "class", "form-control");
    			attr_dev(input, "placeholder", "Cari disini..");
    			attr_dev(input, "type", "text");
    			add_location(input, file$3, 70, 22, 1987);
    			set_style(i1, "cursor", "pointer");
    			attr_dev(i1, "class", "fa fa-search");
    			add_location(i1, file$3, 72, 55, 2166);
    			attr_dev(span, "class", "input-group-text");
    			add_location(span, file$3, 72, 24, 2135);
    			attr_dev(div6, "class", "input-group-append");
    			add_location(div6, file$3, 71, 22, 2078);
    			attr_dev(div7, "class", "input-group");
    			add_location(div7, file$3, 69, 20, 1939);
    			attr_dev(div8, "class", "form-group mr-2");
    			add_location(div8, file$3, 68, 18, 1889);
    			attr_dev(div9, "class", "heading-tools svelte-ige2at");
    			add_location(div9, file$3, 67, 16, 1843);
    			attr_dev(div10, "class", "card-header");
    			add_location(div10, file$3, 59, 14, 1509);
    			attr_dev(th0, "class", "text-center");
    			add_location(th0, file$3, 87, 24, 2739);
    			add_location(th1, file$3, 88, 24, 2794);
    			add_location(th2, file$3, 89, 24, 2840);
    			add_location(th3, file$3, 90, 24, 2880);
    			attr_dev(th4, "class", "text-right");
    			add_location(th4, file$3, 91, 24, 2920);
    			add_location(tr, file$3, 86, 20, 2710);
    			add_location(thead, file$3, 85, 16, 2682);
    			add_location(tbody, file$3, 94, 16, 3020);
    			attr_dev(table, "class", "table");
    			add_location(table, file$3, 84, 14, 2644);
    			attr_dev(div11, "class", "card card-primary card-outline");
    			add_location(div11, file$3, 58, 12, 1450);
    			attr_dev(div12, "class", "col-md-12");
    			add_location(div12, file$3, 57, 10, 1414);
    			attr_dev(div13, "class", "row");
    			add_location(div13, file$3, 56, 8, 1386);
    			attr_dev(div14, "class", "container-fluid");
    			add_location(div14, file$3, 55, 6, 1348);
    			attr_dev(section1, "class", "content");
    			add_location(section1, file$3, 54, 4, 1316);
    			attr_dev(div15, "class", "container");
    			add_location(div15, file$3, 35, 2, 705);
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
    			append_dev(div15, t3);
    			append_dev(div15, section1);
    			append_dev(section1, div14);
    			append_dev(div14, div13);
    			append_dev(div13, div12);
    			append_dev(div12, div11);
    			append_dev(div11, div10);
    			append_dev(div10, div5);
    			append_dev(div5, i0);
    			append_dev(div5, t4);
    			append_dev(div5, div4);
    			append_dev(div4, h5);
    			append_dev(div4, t6);
    			append_dev(div4, p);
    			append_dev(div10, t8);
    			append_dev(div10, div9);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, input);
    			append_dev(div7, t9);
    			append_dev(div7, div6);
    			append_dev(div6, span);
    			append_dev(span, i1);
    			append_dev(div9, t10);
    			mount_component(link1, div9, null);
    			append_dev(div11, t11);
    			append_dev(div11, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t13);
    			append_dev(tr, th1);
    			append_dev(tr, t15);
    			append_dev(tr, th2);
    			append_dev(tr, t17);
    			append_dev(tr, th3);
    			append_dev(tr, t19);
    			append_dev(tr, th4);
    			append_dev(table, t21);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const link0_changes = {};

    			if (dirty & /*$$scope*/ 16) {
    				link0_changes.$$scope = { dirty, ctx };
    			}

    			link0.$set(link0_changes);
    			const link1_changes = {};

    			if (dirty & /*$$scope*/ 16) {
    				link1_changes.$$scope = { dirty, ctx };
    			}

    			link1.$set(link1_changes);

    			if (dirty & /*user_data*/ 1) {
    				each_value = /*user_data*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
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
    			destroy_each(each_blocks, detaching);
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
    	let user_data = [
    		{
    			id: "1",
    			nama_lengkap: "Andrew Mike",
    			posisi: "Administrator",
    			status: "aktif"
    		},
    		{
    			id: "2",
    			nama_lengkap: "John Doe",
    			posisi: "Administrator",
    			status: "aktif"
    		}
    	];

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Pengguna> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Pengguna", $$slots, []);
    	$$self.$capture_state = () => ({ Router, Link, Route, user_data });

    	$$self.$inject_state = $$props => {
    		if ("user_data" in $$props) $$invalidate(0, user_data = $$props.user_data);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [user_data];
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

    /* src/Pages/TambahPengguna.svelte generated by Svelte v3.19.2 */
    const file$4 = "src/Pages/TambahPengguna.svelte";

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
    			t30 = text(" All rights\n    reserved.");
    			add_location(h1, file$4, 11, 12, 346);
    			attr_dev(div0, "class", "col-sm-6");
    			add_location(div0, file$4, 10, 10, 311);
    			attr_dev(li0, "class", "breadcrumb-item");
    			add_location(li0, file$4, 15, 14, 471);
    			attr_dev(li1, "class", "breadcrumb-item");
    			add_location(li1, file$4, 16, 14, 558);
    			attr_dev(li2, "class", "breadcrumb-item active");
    			add_location(li2, file$4, 17, 14, 643);
    			attr_dev(ol, "class", "breadcrumb float-sm-right");
    			add_location(ol, file$4, 14, 12, 418);
    			attr_dev(div1, "class", "col-sm-6");
    			add_location(div1, file$4, 13, 10, 383);
    			attr_dev(div2, "class", "row mb-2");
    			add_location(div2, file$4, 9, 8, 278);
    			attr_dev(div3, "class", "container-fluid");
    			add_location(div3, file$4, 8, 6, 240);
    			attr_dev(section0, "class", "content-header");
    			add_location(section0, file$4, 7, 4, 201);
    			attr_dev(i, "class", "fas fa-user-plus");
    			add_location(i, file$4, 33, 39, 1153);
    			attr_dev(h3, "class", "card-title");
    			add_location(h3, file$4, 33, 16, 1130);
    			attr_dev(div4, "class", "card-header");
    			add_location(div4, file$4, 32, 14, 1088);
    			attr_dev(label0, "for", "name");
    			add_location(label0, file$4, 40, 20, 1434);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "id", "name");
    			attr_dev(input0, "placeholder", "Masukkan Nama");
    			add_location(input0, file$4, 41, 20, 1485);
    			attr_dev(div5, "class", "form-group");
    			add_location(div5, file$4, 39, 18, 1389);
    			attr_dev(label1, "for", "username");
    			add_location(label1, file$4, 44, 20, 1652);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "form-control");
    			attr_dev(input1, "id", "username");
    			attr_dev(input1, "placeholder", "Masukkan Username");
    			add_location(input1, file$4, 45, 20, 1711);
    			attr_dev(div6, "class", "form-group");
    			add_location(div6, file$4, 43, 18, 1607);
    			attr_dev(label2, "for", "password");
    			add_location(label2, file$4, 48, 20, 1886);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "class", "form-control");
    			attr_dev(input2, "id", "password");
    			attr_dev(input2, "placeholder", "Masukkan Password");
    			add_location(input2, file$4, 49, 20, 1945);
    			attr_dev(div7, "class", "form-group");
    			add_location(div7, file$4, 47, 18, 1841);
    			add_location(label3, file$4, 52, 24, 2124);
    			option0.__value = "-PILIH-";
    			option0.value = option0.__value;
    			add_location(option0, file$4, 54, 26, 2229);
    			option1.__value = "Administrator";
    			option1.value = option1.__value;
    			add_location(option1, file$4, 55, 26, 2280);
    			option2.__value = "Kasir";
    			option2.value = option2.__value;
    			add_location(option2, file$4, 56, 26, 2337);
    			attr_dev(select, "class", "form-control");
    			add_location(select, file$4, 53, 24, 2173);
    			attr_dev(div8, "class", "form-group");
    			add_location(div8, file$4, 51, 18, 2075);
    			attr_dev(div9, "class", "card-body");
    			add_location(div9, file$4, 38, 16, 1347);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "btn btn-primary");
    			add_location(button, file$4, 64, 18, 2563);
    			attr_dev(div10, "class", "card-footer");
    			add_location(div10, file$4, 63, 16, 2519);
    			attr_dev(form, "role", "form");
    			add_location(form, file$4, 37, 14, 1312);
    			attr_dev(div11, "class", "card card-primary");
    			add_location(div11, file$4, 31, 12, 1042);
    			attr_dev(div12, "class", "col-md-12");
    			add_location(div12, file$4, 29, 10, 963);
    			attr_dev(div13, "class", "row");
    			add_location(div13, file$4, 27, 8, 904);
    			attr_dev(div14, "class", "container-fluid");
    			add_location(div14, file$4, 26, 6, 866);
    			attr_dev(section1, "class", "content");
    			add_location(section1, file$4, 25, 4, 834);
    			attr_dev(div15, "class", "content-wrapper");
    			add_location(div15, file$4, 5, 2, 125);
    			add_location(b, file$4, 81, 6, 2986);
    			attr_dev(div16, "class", "float-right d-none d-sm-block");
    			add_location(div16, file$4, 80, 4, 2936);
    			attr_dev(a, "href", "#");
    			add_location(a, file$4, 83, 34, 3050);
    			add_location(strong, file$4, 83, 4, 3020);
    			attr_dev(footer, "class", "main-footer");
    			add_location(footer, file$4, 79, 2, 2903);
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

    /* src/Pages/Dashboard.svelte generated by Svelte v3.19.2 */

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

    /* src/App.svelte generated by Svelte v3.19.2 */
    const file$5 = "src/App.svelte";

    // (31:0) <Router>
    function create_default_slot$3(ctx) {
    	let t0;
    	let div0;
    	let t1;
    	let t2;
    	let t3;
    	let footer;
    	let div1;
    	let b;
    	let t5;
    	let t6;
    	let strong;
    	let t7;
    	let a;
    	let t9;
    	let t10;
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
    			div0 = element("div");
    			create_component(route0.$$.fragment);
    			t1 = space();
    			create_component(route1.$$.fragment);
    			t2 = space();
    			create_component(route2.$$.fragment);
    			t3 = space();
    			footer = element("footer");
    			div1 = element("div");
    			b = element("b");
    			b.textContent = "Version";
    			t5 = text(" 1.0");
    			t6 = space();
    			strong = element("strong");
    			t7 = text("Copyright © 2020 ");
    			a = element("a");
    			a.textContent = "Lumera System";
    			t9 = text(".");
    			t10 = text(" All rights reserved.");
    			attr_dev(div0, "class", "content-wrapper svelte-kqx5hh");
    			set_style(div0, "margin-left", /*containerMarginVisibletoSidebar*/ ctx[0] + "px");
    			add_location(div0, file$5, 33, 3, 754);
    			add_location(b, file$5, 42, 8, 1210);
    			attr_dev(div1, "class", "float-right d-none d-sm-block");
    			add_location(div1, file$5, 41, 5, 1158);
    			attr_dev(a, "href", "#");
    			add_location(a, file$5, 44, 35, 1276);
    			add_location(strong, file$5, 44, 5, 1246);
    			attr_dev(footer, "class", "main-footer svelte-kqx5hh");
    			set_style(footer, "margin-left", /*containerMarginVisibletoSidebar*/ ctx[0] + "px");
    			add_location(footer, file$5, 40, 3, 1066);
    		},
    		m: function mount(target, anchor) {
    			mount_component(sidebar, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div0, anchor);
    			mount_component(route0, div0, null);
    			append_dev(div0, t1);
    			mount_component(route1, div0, null);
    			append_dev(div0, t2);
    			mount_component(route2, div0, null);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div1);
    			append_dev(div1, b);
    			append_dev(div1, t5);
    			append_dev(footer, t6);
    			append_dev(footer, strong);
    			append_dev(strong, t7);
    			append_dev(strong, a);
    			append_dev(strong, t9);
    			append_dev(footer, t10);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*containerMarginVisibletoSidebar*/ 1) {
    				set_style(div0, "margin-left", /*containerMarginVisibletoSidebar*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*containerMarginVisibletoSidebar*/ 1) {
    				set_style(footer, "margin-left", /*containerMarginVisibletoSidebar*/ ctx[0] + "px");
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
    			if (detaching) detach_dev(div0);
    			destroy_component(route0);
    			destroy_component(route1);
    			destroy_component(route2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(31:0) <Router>",
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
