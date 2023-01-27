ARROW = ../bin/quence.js
SRCS = $(wildcard *.wsd)
PICS = ${SRCS:.wsd=.png}

.SUFFIXES:
.SUFFIXES: .wsd .png .pdf
.PRECIOUS: %.pdf

all: $(PICS)

clean:
	-$(RM) *.pdf *.png

.wsd.pdf :
	$(ARROW) -p no_link -p line_color=lightgray -p arrow_color=lightgray -p rung_color=lightgray -p text_color=lightgray -o pdf $<

.pdf.png :
	gs -q -dNOPAUSE -dBATCH -sDEVICE=pngalpha -r100 -dEPSCrop -sOutputFile=$@ $<
	convert -trim -background transparent -splice 50x0 $@ $@.tmp
	mv $@.tmp $@
