// Include the Ruby headers and goodies
#include "ruby.h"
#include <zlib.h>

// Defining a space for information and references about the module to be stored internally
VALUE MyZlib = Qnil;

// Prototype for the initialization method - Ruby calls this, not you
void Init_myzlib();

// Our 'test1' method.. it simply returns a value of '10' for now.
VALUE method_inflate(VALUE self, VALUE size_out, VALUE input, VALUE in_length) {
	z_stream stream;
  int size  = NUM2INT(size_out);
	void *buf = xmalloc(size);
  unsigned int len   = NUM2INT(in_length);
  int used;
  void *whereat = StringValuePtr(input);

	memset(&stream, 0, sizeof(stream));

	stream.next_out = buf;
	stream.avail_out = size;
	stream.next_in = whereat;
	stream.avail_in = len;
  
  inflateInit(&stream);
  
	for (;;) {
    int ret = inflate(&stream, 0);  
    used = len - stream.avail_in;
    whereat += used;
  	const char *err;
    if (stream.total_out == size && ret == Z_STREAM_END) {
			break;
    }
    else {
  		if (ret != Z_OK) {
        printf("inflate returned %d\n", ret);
        //exit(1);
  			break;
      }
  		stream.next_in = whereat;
  		stream.avail_in = len;
    }
  }
  inflateEnd(&stream);
  VALUE ary = rb_ary_new();
  rb_ary_push(ary, rb_str_new(buf, size));
  rb_ary_push(ary, INT2NUM(used));
  return ;
}

// The initialization method for this module
void Init_myzlib() {
	MyZlib = rb_define_module("MyZlib");
	rb_define_method(MyZlib, "inflate", method_inflate, 3);
}

