resource "aws_default_vpc" "default" {
  tags = {
    Name = "Default VPC"
  }
}
resource "aws_default_subnet" "default_az1" {
  availability_zone = "us-west-2a"

  tags = {
    Name = "Default subnet for us-west-2a"
  }
}
resource "aws_default_subnet" "default_az2" {
  availability_zone = "us-west-2b"
  map_public_ip_on_launch = false
  tags = {
    Name = "Default subnet for us-west-2b PRIVATE"
  }
}

resource "aws_subnet" "private_2c" {
  vpc_id = aws_default_vpc.default.id

  map_public_ip_on_launch = false
  availability_zone = "us-west-2c"
  # Our other Private Subnet is at 172.31.16.0/20
  # This is the next free /20 block
  cidr_block = "172.31.80.0/20"

  tags = {
    Name = "Private subnet for us-west-2c"
  }
}

resource "aws_default_subnet" "default_az3" {
  availability_zone = "us-west-2c"

  tags = {
    Name = "Default subnet for us-west-2c"
  }
}
resource "aws_default_subnet" "default_az4" {
  availability_zone = "us-west-2d"

  tags = {
    Name = "Default subnet for us-west-2d"
  }
}

output "private_subnets" {
  value = [aws_default_subnet.default_az2]
}

output "vpc_id" {
  value = aws_default_vpc.default.id
}
