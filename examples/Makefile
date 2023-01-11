ARROW = ../bin/quence.js
SRCS = $(wildcard *.wsd)
PDFS = ${SRCS:.wsd=.pdf}
JSONS = ${SRCS:.wsd=.json}
SVGS = ${SRCS:.wsd=.svg}

.SUFFIXES:
.SUFFIXES: .wsd .png .pdf .json .svg

all: $(JSONS) $(SVGS) $(PDFS)

clean:
	-$(RM) *.pdf *.png *.json *.svg

.wsd.pdf :
	$(ARROW) -o pdf $<

.wsd.json :
	$(ARROW) -o json $<

.wsd.svg :
	$(ARROW) -o svg $<

.pdf.png :
	gs -q -dNOPAUSE -dBATCH -sDEVICE=pngalpha -r100 -dEPSCrop -sOutputFile=$@ $<
	convert -trim -background transparent -splice 50x0 $@ $@.tmp
	mv $@.tmp $@
