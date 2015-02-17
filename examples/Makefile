ARROW = ../bin/quence
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
	$(ARROW) -o pdf $< -n

.wsd.json :
	$(ARROW) -o json $< -n

.wsd.svg :
	$(ARROW) -o svg $< -n

.pdf.png :
	gs -q -dNOPAUSE -dBATCH -sDEVICE=pngalpha -r100 -dEPSCrop -sOutputFile=$@ $<
	convert -trim -background transparent -splice 50x0 $@ $@.tmp
	mv $@.tmp $@
